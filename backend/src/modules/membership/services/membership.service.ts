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

      // Welcome notification
      await conn.query(
        `INSERT INTO notifications (id, user_id, type, title, body, channel)
         VALUES (UUID(), :userId, 'welcome', 'Membership Approved!',
                 CONCAT('Congratulations! Your TUMCU membership application has been approved. Your official membership number is ', :membershipNumber, '. Welcome to fellowship!'),
                 'in_app')`,
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

    await pool.query(
      `UPDATE users SET account_status = 'rejected' WHERE id = :userId`,
      { userId: application.user_id }
    );

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

  async listAllMembersWithDetails(search?: string, yearOfStudy?: string, department?: string, status?: string) {
    const [userRows] = await pool.query('SELECT * FROM users');
    const [membershipRows] = await pool.query('SELECT * FROM memberships');
    const [roles] = await pool.query('SELECT * FROM user_roles');
    const [roleList] = await pool.query('SELECT * FROM roles');
    const [minMembers] = await pool.query('SELECT * FROM ministry_members');
    const [ministries] = await pool.query('SELECT * FROM ministries');

    const users = (userRows as any[]) || [];
    const memberships = (membershipRows as any[]) || [];
    const userRoles = (roles as any[]) || [];
    const allRoles = (roleList as any[]) || [];
    const ministryMembers = (minMembers as any[]) || [];
    const allMinistries = (ministries as any[]) || [];

    // Filter out users who are still awaiting approval or rejected and do not have an approved membership
    const registeredMembers = users.filter((u) => {
      const mem = memberships.find((m) => m.user_id === u.id || m.userId === u.id);
      const isPendingOrRejected = u.account_status === 'pending_approval' || u.account_status === 'rejected';
      if (isPendingOrRejected && !mem) return false;
      return true;
    });

    let result = registeredMembers.map((u) => {
      const mem = memberships.find((m) => m.user_id === u.id || m.userId === u.id) || null;
      const uRole = userRoles.find((ur) => ur.user_id === u.id);
      const roleObj = uRole ? allRoles.find((r) => r.id === uRole.role_id) : null;
      const userMins = ministryMembers
        .filter((mm) => mm.user_id === u.id)
        .map((mm) => {
          const m = allMinistries.find((min) => min.id === mm.ministry_id);
          return m ? m.name : 'Ministry Member';
        });

      return {
        id: mem?.id || u.id,
        user_id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone_number: u.phone_number || 'N/A',
        admission_number: u.admission_number || 'N/A',
        year_of_study: typeof u.year_of_study === 'number' ? `Year ${u.year_of_study}` : String(u.year_of_study || 'Year 1'),
        department: u.department || u.school || 'School of Computing and Informatics',
        membership_number: mem?.membership_number || mem?.membershipNumber || `TUMCU/${new Date().getFullYear()}/${u.admission_number?.slice(-3) || '101'}`,
        membership_type: mem?.membership_type_id === 'mt-special' ? 'Special Member' : 'Full Member',
        status: mem?.status || u.account_status || 'active',
        registration_date: mem?.registration_date || mem?.registrationDate || u.created_at,
        role_name: roleObj?.name || 'Member',
        ministries: userMins.length > 0 ? userMins.join(', ') : 'None',
      };
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          String(m.full_name || '').toLowerCase().includes(q) ||
          String(m.email || '').toLowerCase().includes(q) ||
          String(m.admission_number || '').toLowerCase().includes(q) ||
          String(m.membership_number || '').toLowerCase().includes(q)
      );
    }
    if (yearOfStudy && yearOfStudy !== 'all') {
      result = result.filter((m) => String(m.year_of_study || '').toLowerCase().includes(yearOfStudy.toLowerCase()));
    }
    if (department && department !== 'all') {
      result = result.filter((m) => String(m.department || '').toLowerCase().includes(department.toLowerCase()));
    }
    if (status && status !== 'all') {
      result = result.filter((m) => m.status === status);
    }

    // Sort by year of study then name
    result.sort((a, b) => String(a.year_of_study).localeCompare(String(b.year_of_study)) || String(a.full_name).localeCompare(String(b.full_name)));

    return result;
  }

  async deleteMember(memberIdOrUserId: string) {
    const [userRows] = await pool.query('SELECT * FROM users');
    const [membershipRows] = await pool.query('SELECT * FROM memberships');
    const users = (userRows as any[]) || [];
    const memberships = (membershipRows as any[]) || [];

    const member = memberships.find((m) => m.id === memberIdOrUserId || m.user_id === memberIdOrUserId);
    const userId = member ? member.user_id : memberIdOrUserId;

    // Remove user and memberships from pool / in-memory store
    await pool.query('DELETE FROM memberships WHERE id = :id', { id: member?.id || memberIdOrUserId });
    await pool.query('DELETE FROM users WHERE id = :id', { id: userId });
    await pool.query('DELETE FROM user_roles WHERE user_id = :id', { id: userId });
    await pool.query('DELETE FROM ministry_members WHERE user_id = :id', { id: userId });

    return { id: memberIdOrUserId, userId, deleted: true };
  }

  async exportMembersCsv() {
    const members = await this.listAllMembersWithDetails();
    const headers = [
      'Membership No',
      'Full Name',
      'Admission No',
      'Year of Study',
      'Department / Faculty',
      'Email',
      'Phone Number',
      'Role',
      'Ministries',
      'Status',
      'Registered Date',
    ];

    const rows = members.map((m) => [
      `"${m.membership_number}"`,
      `"${m.full_name}"`,
      `"${m.admission_number}"`,
      `"${m.year_of_study}"`,
      `"${m.department}"`,
      `"${m.email}"`,
      `"${m.phone_number}"`,
      `"${m.role_name}"`,
      `"${m.ministries}"`,
      `"${m.status}"`,
      `"${m.registration_date}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return {
      filename: `TUMCU_Membership_Register_${new Date().toISOString().split('T')[0]}.csv`,
      csv,
    };
  }
}
