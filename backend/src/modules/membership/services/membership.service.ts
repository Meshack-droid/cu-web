import { pool, query } from '../../../config/database';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';
import { toMySQLDateTime } from '../../../utils/datetime';
import {
  MembershipApplicationRepository,
  MembershipRepository,
} from '../repositories/membership.repository';

export class MembershipService {
  constructor(
    private readonly applications: MembershipApplicationRepository = new MembershipApplicationRepository(),
    private readonly memberships: MembershipRepository = new MembershipRepository()
  ) {}

  listApplications(status?: string, page = 1, pageSize = 20) {
    return this.applications.listWithApplicantInfo(status, page, pageSize);
  }

  /**
   * Approval workflow (Chapter 4):
   *   Application -> Review -> Approval -> Membership Number Generated ->
   *   Welcome Notification -> Added to Member Register
   */
  async approveApplication(applicationId: string, reviewerId: string) {
    const application = await this.applications.findById(applicationId);
    if (application.status === 'approved') {
      throw new BusinessRuleError('This application has already been approved');
    }

    const spiritualYear = await this.memberships.findCurrentSpiritualYear();
    if (!spiritualYear) throw new NotFoundError('Current spiritual year');

    const declaration = await this.memberships.findActiveDeclaration();
    if (!declaration) throw new NotFoundError('Active membership declaration');

    const year = new Date().getFullYear();
    const membershipNumber = await this.memberships.generateMembershipNumber(year);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const membershipId = await this.memberships.createFromApplication({
        userId: application.user_id,
        membershipTypeId: application.membership_type_id,
        spiritualYearId: spiritualYear.id,
        declarationId: declaration.id,
        membershipNumber,
      });

      await conn.query(
        `UPDATE membership_applications
            SET status = 'approved', reviewed_by = :reviewerId, reviewed_at = NOW(),
                resulting_membership_id = :membershipId
          WHERE id = :applicationId`,
        { reviewerId, membershipId, applicationId } as never
      );

      await conn.query(
        `UPDATE users SET account_status = 'active' WHERE id = :userId`,
        { userId: application.user_id } as never
      );

      // Every active member receives the baseline Member role. Leadership
      // roles are additive and may be assigned separately.
      await conn.query(
        `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
         SELECT UUID(), :userId, r.id, 'global', NULL, CURDATE(), TRUE, :assignedBy
           FROM roles r
          WHERE r.code = 'member'
            AND NOT EXISTS (
              SELECT 1 FROM user_roles ur
               WHERE ur.user_id = :userId
                 AND ur.role_id = r.id
                 AND ur.is_current = TRUE
            )`,
        { userId: application.user_id, assignedBy: reviewerId } as never
      );

      // Welcome notification — queued for the background job worker (Chapter 75).
      await conn.query(
        `INSERT INTO notifications (id, user_id, type, title, body, channel)
         VALUES (UUID(), :userId, 'welcome', 'Welcome to TUMCU!',
                 CONCAT('Your membership has been approved. Your membership number is ', :membershipNumber, '.'),
                 'email')`,
        { userId: application.user_id, membershipNumber } as never
      );

      await conn.commit();
      return this.memberships.findById(membershipId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async rejectApplication(applicationId: string, reviewerId: string, reason: string) {
    const application = await this.applications.findById(applicationId);
    if (application.status === 'approved') {
      throw new BusinessRuleError('An approved application cannot be rejected');
    }

    return this.applications.update(applicationId, {
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: toMySQLDateTime(),
      rejection_reason: reason,
    } as never);
  }

  /** Annual renewal — a member re-signs the declaration for the new spiritual year. */
  async renew(userId: string, spiritualYearId: string, declarationId: string) {
    const existing = await query<unknown[]>(
      `SELECT id FROM memberships WHERE user_id = :userId AND spiritual_year_id = :spiritualYearId LIMIT 1`,
      { userId, spiritualYearId }
    );
    if (existing.length > 0) {
      throw new BusinessRuleError('Membership already renewed for this spiritual year');
    }

    const priorRows = await query<{ membership_type_id: string; membership_number: string }[]>(
      `SELECT membership_type_id, membership_number
         FROM memberships WHERE user_id = :userId
         ORDER BY registration_date DESC LIMIT 1`,
      { userId }
    );
    const prior = priorRows[0];
    if (!prior) throw new NotFoundError('Prior membership record');

    const year = new Date().getFullYear();
    const membershipNumber = await this.memberships.generateMembershipNumber(year);

    const membershipId = await this.memberships.createFromApplication({
      userId,
      membershipTypeId: prior.membership_type_id,
      spiritualYearId,
      declarationId,
      membershipNumber,
    });

    // Preserve the baseline Member role across annual renewals.
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current)
       SELECT UUID(), :userId, r.id, 'global', NULL, CURDATE(), TRUE
         FROM roles r
        WHERE r.code = 'member'
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
             WHERE ur.user_id = :userId
               AND ur.role_id = r.id
               AND ur.is_current = TRUE
          )`,
      { userId }
    );

    return this.memberships.findById(membershipId);
  }

  getMembership(id: string) {
    return this.memberships.findById(id);
  }

  /** Self-service: a member's own membership + application history, no admin permission required. */
  async getMyStatus(userId: string) {
    const [memberships, applications] = await Promise.all([
      this.memberships.findAll({ user_id: userId }, { page: 1, pageSize: 10 }),
      this.applications.findAll({ user_id: userId }, { page: 1, pageSize: 10 }),
    ]);
    return { memberships: memberships.rows, applications: applications.rows };
  }

  listMemberships(filters: Record<string, unknown> = {}, page = 1, pageSize = 20) {
    return this.memberships.findAll(filters, { page, pageSize });
  }
}
