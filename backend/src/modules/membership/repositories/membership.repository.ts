import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { BaseRepository } from '../../../core/base.repository';
import { Membership, MembershipApplication } from '../interfaces/membership.interface';

export class MembershipApplicationRepository extends BaseRepository<MembershipApplication> {
  constructor() {
    super('membership_applications');
  }

  /** For the admin review screen — the applicant's name/email is essential context a bare user_id isn't. */
  async listWithApplicantInfo(status: string | undefined, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const where = status ? 'WHERE ma.status = :status' : '';
    const params: Record<string, unknown> = status ? { status } : {};

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM membership_applications ma ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await query(
      `SELECT
          ma.id, ma.status, ma.rejection_reason, ma.created_at,
          u.id AS user_id, u.full_name, u.email, u.admission_number,
          mt.name AS membership_type_name
        FROM membership_applications ma
        JOIN users u ON u.id = ma.user_id
        JOIN membership_types mt ON mt.id = ma.membership_type_id
        ${where}
        ORDER BY ma.created_at DESC
        LIMIT :limit OFFSET :offset`,
      { ...params, limit: pageSize, offset }
    );

    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export class MembershipRepository extends BaseRepository<Membership> {
  constructor() {
    super('memberships');
  }

  /** Generates the next sequential membership number, e.g. TUMCU-2026-0001. */
  async generateMembershipNumber(year: number): Promise<string> {
    const rows = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM memberships WHERE membership_number LIKE :pattern`,
      { pattern: `TUMCU-${year}-%` }
    );
    const count = rows[0]?.count ?? 0;
    return `TUMCU-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findCurrentSpiritualYear(): Promise<{ id: string } | null> {
    const rows = await query<{ id: string }[]>(
      `SELECT id FROM spiritual_years WHERE is_current = TRUE LIMIT 1`
    );
    return rows[0] ?? null;
  }

  async findActiveDeclaration(): Promise<{ id: string } | null> {
    const rows = await query<{ id: string }[]>(
      `SELECT id FROM membership_declarations WHERE is_active = TRUE LIMIT 1`
    );
    return rows[0] ?? null;
  }

  async createFromApplication(params: {
    userId: string;
    membershipTypeId: string;
    spiritualYearId: string;
    declarationId: string;
    membershipNumber: string;
  }) {
    const id = uuidv4();
    await query(
      `INSERT INTO memberships
         (id, user_id, membership_number, membership_type_id, spiritual_year_id,
          status, registration_date, declaration_id, declaration_signed_at)
       VALUES
         (:id, :userId, :membershipNumber, :membershipTypeId, :spiritualYearId,
          'active', CURDATE(), :declarationId, NOW())`,
      { id, ...params }
    );
    return id;
  }
}
