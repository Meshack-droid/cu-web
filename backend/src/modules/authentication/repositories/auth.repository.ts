import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { User } from '../interfaces/user.interface';

export class AuthRepository {
  async findByIdentifier(identifier: string): Promise<User | null> {
    const rows = await query<User[]>(
      `SELECT * FROM users
        WHERE (LOWER(email) = LOWER(:identifier) OR admission_number = :identifier OR phone_number = :identifier)
          AND deleted_at IS NULL
        LIMIT 1`,
      { identifier }
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await query<User[]>(
      `SELECT * FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1`,
      { id }
    );
    return rows[0] ?? null;
  }

  async emailOrAdmissionExists(email: string, admissionNumber?: string): Promise<boolean> {
    const rows = await query<unknown[]>(
      `SELECT id FROM users WHERE deleted_at IS NULL AND (email = :email OR (admission_number IS NOT NULL AND admission_number = :admissionNumber)) LIMIT 1`,
      { email, admissionNumber: admissionNumber ?? null }
    );
    return rows.length > 0;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const id = uuidv4();
    const username = (data.email as string).split('@')[0] + '_' + id.slice(0, 6);
    const record = { ...data, id, username };
    const columns = Object.keys(record);

    await query(
      `INSERT INTO users (${columns.join(', ')}) VALUES (${columns.map((c) => `:${c}`).join(', ')})`,
      record as Record<string, unknown>
    );
    return this.findById(id) as Promise<User>;
  }

  async updateLastLogin(id: string): Promise<void> {
    await query(
      `UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = :id`,
      { id }
    );
  }

  /**
   * Returns the new attempt count so the service can decide whether to lock
   * the account. Deliberately reads the current count first rather than
   * writing `failed_login_attempts = failed_login_attempts + 1` and
   * referencing that column again in the same UPDATE's CASE expression —
   * MySQL evaluates a single-table UPDATE's SET assignments left to right,
   * so a later expression can see the *already-incremented* value of an
   * earlier one, silently double-counting and locking the account one
   * attempt early. Two round trips avoids relying on that evaluation order.
   */
  async registerFailedLogin(id: string, lockThreshold: number, lockMinutes: number): Promise<number> {
    const current = await query<{ failed_login_attempts: number }[]>(
      `SELECT COALESCE(failed_login_attempts, 0) AS failed_login_attempts FROM users WHERE id = :id`,
      { id }
    );
    const newAttempts = (current[0]?.failed_login_attempts ?? 0) + 1;
    const shouldLock = newAttempts >= lockThreshold;

    await query(
      `UPDATE users
          SET failed_login_attempts = :newAttempts,
              locked_until = ${shouldLock ? 'DATE_ADD(NOW(), INTERVAL :lockMinutes MINUTE)' : 'locked_until'}
        WHERE id = :id`,
      { id, newAttempts, lockMinutes }
    );
    return newAttempts;
  }

  async logSecurityEvent(params: {
    userId?: string | null;
    eventType: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await query(
      `INSERT INTO security_events (id, user_id, event_type, ip_address, user_agent, metadata)
       VALUES (UUID(), :userId, :eventType, :ipAddress, :userAgent, :metadata)`,
      {
        userId: params.userId ?? null,
        eventType: params.eventType,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      }
    );
  }

  async storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (:id, :userId, :tokenHash, :expiresAt)`,
      { id: uuidv4(), userId, tokenHash, expiresAt }
    );
  }

  async findValidRefreshToken(tokenHash: string) {
    const rows = await query<{ id: string; user_id: string }[]>(
      `SELECT * FROM refresh_tokens
        WHERE token_hash = :tokenHash AND revoked_at IS NULL AND expires_at > NOW()
        LIMIT 1`,
      { tokenHash }
    );
    return rows[0] ?? null;
  }

  /** Includes revoked tokens — used to detect refresh-token reuse (possible theft). */
  async findRefreshTokenByHash(tokenHash: string) {
    const rows = await query<{ id: string; user_id: string; revoked_at: string | null }[]>(
      `SELECT * FROM refresh_tokens WHERE token_hash = :tokenHash LIMIT 1`,
      { tokenHash }
    );
    return rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :tokenHash`, {
      tokenHash,
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL`,
      { userId }
    );
  }
}
