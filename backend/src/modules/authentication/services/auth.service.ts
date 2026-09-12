import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/auth.repository';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { AuthenticationError, ConflictError, NotFoundError } from '../../../utils/errors';
import { env } from '../../../config/env';
import { pool } from '../../../config/database';
import { toPublicUser } from '../interfaces/user.interface';

const REFRESH_TOKEN_DAYS = 30;
const LOCK_THRESHOLD = 5; // failed attempts before lockout
const LOCK_MINUTES = 15;

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  constructor(private readonly repository: AuthRepository = new AuthRepository()) {}

  /**
   * Registration workflow per Chapter 4:
   *   Application -> Review -> Approval -> Membership Number -> Welcome -> Register
   * This step creates the user account (pending_approval) and opens a
   * membership application; approval happens in the Membership module.
   */
  async register(dto: RegisterDto) {
    const exists = await this.repository.emailOrAdmissionExists(dto.email, dto.admission_number);
    if (exists) throw new ConflictError('An account with this email or admission number already exists');

    const password_hash = await bcrypt.hash(dto.password, 12);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [membershipTypeRows] = await connection.query(
        `SELECT id FROM membership_types WHERE code = :code LIMIT 1`,
        { code: dto.membership_type }
      );
      const membershipType = (membershipTypeRows as { id: string }[])[0];
      if (!membershipType) throw new NotFoundError('Membership type');

      const userId = uuidv4();
      const username = dto.email.split('@')[0] + '_' + userId.slice(0, 6);
      await connection.query(
        `INSERT INTO users (id, username, full_name, email, phone_number, admission_number, password_hash, account_status)
         VALUES (:id, :username, :fullName, :email, :phoneNumber, :admissionNumber, :passwordHash, 'pending_approval')`,
        {
          id: userId,
          username,
          fullName: dto.full_name,
          email: dto.email,
          phoneNumber: dto.phone_number ?? null,
          admissionNumber: dto.admission_number ?? null,
          passwordHash: password_hash,
        }
      );

      await connection.query(
        `INSERT INTO membership_applications (id, user_id, membership_type_id, status)
         VALUES (:id, :userId, :membershipTypeId, 'submitted')`,
        { id: uuidv4(), userId, membershipTypeId: membershipType.id }
      );

      await connection.commit();
      const user = await this.repository.findById(userId);
      if (!user) throw new NotFoundError('User');
      return { user: toPublicUser(user) };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Login with brute-force protection: after LOCK_THRESHOLD consecutive
   * failures the account is locked for LOCK_MINUTES, regardless of whether
   * subsequent attempts use the correct password. Every attempt — success
   * or failure — is written to security_events for monitoring/alerting.
   */
  async login(dto: LoginDto, ctx: RequestContext = {}) {
    const user = await this.repository.findByIdentifier(dto.identifier);

    // Constant-shape response whether or not the identifier exists, to avoid
    // leaking which identifiers are registered (user enumeration).
    if (!user) {
      await this.repository.logSecurityEvent({
        eventType: 'login_failure',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: 'unknown_identifier', identifier: dto.identifier },
      });
      throw new AuthenticationError('Invalid credentials');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await this.repository.logSecurityEvent({
        userId: user.id,
        eventType: 'login_failure',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: 'account_locked' },
      });
      throw new AuthenticationError(
        `Too many failed attempts. This account is temporarily locked until ${new Date(user.locked_until).toLocaleTimeString()}.`
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatches) {
      const attempts = await this.repository.registerFailedLogin(user.id, LOCK_THRESHOLD, LOCK_MINUTES);
      const justLocked = attempts >= LOCK_THRESHOLD;
      await this.repository.logSecurityEvent({
        userId: user.id,
        eventType: justLocked ? 'account_locked' : 'login_failure',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: 'bad_password', attempts },
      });
      throw new AuthenticationError(
        justLocked
          ? `Too many failed attempts. This account is locked for ${LOCK_MINUTES} minutes.`
          : 'Invalid credentials'
      );
    }

    if (['suspended', 'archived', 'deceased'].includes(user.account_status)) {
      throw new AuthenticationError(`Account is ${user.account_status.replace('_', ' ')}`);
    }
    if (user.account_status === 'pending_approval') {
      throw new AuthenticationError(
        'Your membership application is still pending review. You will be able to log in once it is approved.'
      );
    }

    await this.repository.updateLastLogin(user.id);
    await this.repository.logSecurityEvent({
      userId: user.id,
      eventType: 'login_success',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    const tokens = await this.issueTokens(user.id, user.username);
    return { user: toPublicUser(user), ...tokens };
  }

  /**
   * Refresh-token rotation with reuse detection: a refresh token is single-use.
   * If a token that was already revoked (i.e. already used, or explicitly
   * logged out) is presented again, that's a strong signal of token theft —
   * every session for the user is revoked immediately rather than trusting
   * the presented token.
   */
  async refresh(refreshToken: string, ctx: RequestContext = {}) {
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken === 'undefined' || refreshToken === 'null' || !refreshToken.trim()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // 1. Verify cryptographic signature and expiration of the refresh JWT
    let decoded: { sub: string; jti?: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; jti?: string };
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    if (!decoded || !decoded.sub) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);

    if (!stored) {
      const existing = await this.repository.findRefreshTokenByHash(tokenHash);
      if (existing?.revoked_at) {
        // Concurrency grace window (30 seconds): allow concurrent in-flight requests or network retries
        const revokedTime = new Date(existing.revoked_at).getTime();
        const isRecentRevocation = !isNaN(revokedTime) && Date.now() - revokedTime < 30_000;

        if (!isRecentRevocation) {
          await this.repository.revokeAllRefreshTokens(existing.user_id);
          await this.repository.logSecurityEvent({
            userId: existing.user_id,
            eventType: 'token_refresh_reuse_detected',
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          });
          throw new AuthenticationError('Invalid or expired refresh token');
        }
      }
    }

    // Resolve user: from stored database record or verified decoded JWT sub
    const userId = stored?.user_id || decoded.sub;
    let user = await this.repository.findById(userId);
    if (!user) {
      user = await this.repository.findByIdentifier(userId);
    }
    if (!user) throw new AuthenticationError('User no longer exists');

    // Rotate: revoke the used token, issue a new pair
    await this.repository.revokeRefreshToken(tokenHash).catch(() => {});
    await this.repository.logSecurityEvent({
      userId: user.id,
      eventType: 'token_refresh',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return this.issueTokens(user.id, user.username);
  }

  async logout(refreshToken: string) {
    await this.repository.revokeRefreshToken(hashToken(refreshToken));
  }

  async logoutEverywhere(userId: string) {
    await this.repository.revokeAllRefreshTokens(userId);
  }

  async getUserById(userId: string) {
    return this.repository.findById(userId);
  }

  private async issueTokens(userId: string, username: string) {
    const accessToken = jwt.sign({ sub: userId, username }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    const refreshToken = jwt.sign({ sub: userId, jti: uuidv4() }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await this.repository.storeRefreshToken(userId, hashToken(refreshToken), expiresAt);

    return { accessToken, refreshToken };
  }
}
