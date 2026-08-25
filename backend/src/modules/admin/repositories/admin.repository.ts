import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { RoleOption, RolePermissionMatrixRow, UserRoleAssignment, UserSearchResult } from '../interfaces/admin.interface';

export class AdminRepository {
  async searchUsers(search: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const like = `%${search}%`;

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM users
        WHERE deleted_at IS NULL
          AND (full_name LIKE :like OR email LIKE :like OR admission_number LIKE :like)`,
      { like }
    );

    const rows = await query<UserSearchResult[]>(
      `SELECT id, full_name, email, admission_number, account_status
         FROM users
        WHERE deleted_at IS NULL
          AND (full_name LIKE :like OR email LIKE :like OR admission_number LIKE :like)
        ORDER BY full_name ASC
        LIMIT :limit OFFSET :offset`,
      { like, limit: pageSize, offset }
    );

    const total = countRows[0]?.total ?? 0;
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async listRoles(): Promise<RoleOption[]> {
    return query<RoleOption[]>(
      `SELECT id, code, name, category FROM roles ORDER BY category, name`
    );
  }

  async listRolePermissionMatrix(): Promise<RolePermissionMatrixRow[]> {
    return query<RolePermissionMatrixRow[]>(
      `SELECT
          r.id AS role_id,
          r.code AS role_code,
          r.name AS role_name,
          r.category,
          p.code AS permission_code,
          p.module AS permission_module,
          p.description AS permission_description
         FROM roles r
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
        ORDER BY
          FIELD(r.category, 'system_admin', 'constitutional_leadership', 'committee', 'ministry', 'advisory', 'member'),
          r.name, p.module, p.code`
    );
  }

  async listMinistries() {
    return query<{ id: string; name: string }[]>(`SELECT id, name FROM ministries ORDER BY name`);
  }

  async listCommittees() {
    return query<{ id: string; name: string }[]>(`SELECT id, name FROM committees ORDER BY name`);
  }

  async listUserRoles(userId?: string): Promise<UserRoleAssignment[]> {
    const where = userId ? 'WHERE ur.user_id = :userId' : '';
    return query<UserRoleAssignment[]>(
      `SELECT
          ur.id,
          ur.user_id,
          u.full_name,
          ur.role_id,
          r.code AS role_code,
          r.name AS role_name,
          ur.scope_type,
          ur.scope_id,
          COALESCE(m.name, c.name) AS scope_name,
          ur.start_date,
          ur.end_date,
          ur.is_current
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        JOIN roles r ON r.id = ur.role_id
        LEFT JOIN ministries m ON m.id = ur.scope_id AND ur.scope_type = 'ministry'
        LEFT JOIN committees c ON c.id = ur.scope_id AND ur.scope_type = 'committee'
        ${where}
        ORDER BY ur.is_current DESC, ur.start_date DESC`,
      userId ? { userId } : {}
    );
  }

  /** Prevents duplicate active assignments of the same role+scope to the same user. */
  async findExistingCurrentAssignment(userId: string, roleId: string, scopeId: string | null) {
    const rows = await query<{ id: string }[]>(
      `SELECT id FROM user_roles
        WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE
          AND (scope_id <=> :scopeId)`,
      { userId, roleId, scopeId }
    );
    return rows[0] ?? null;
  }

  async assignRole(params: {
    userId: string;
    roleId: string;
    scopeType: 'global' | 'committee' | 'ministry' | 'executive';
    scopeId: string | null;
    assignedBy: string;
  }) {
    const id = uuidv4();
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
       VALUES (:id, :userId, :roleId, :scopeType, :scopeId, CURDATE(), TRUE, :assignedBy)`,
      { id, ...params }
    );
    return id;
  }

  /** Ends a role assignment (leadership transition / term end) rather than deleting the row — preserves history. */
  async revokeRole(userRoleId: string) {
    await query(
      `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE() WHERE id = :userRoleId`,
      { userRoleId }
    );
  }

  async findUserRoleById(userRoleId: string) {
    const rows = await query<{ id: string; role_code: string }[]>(
      `SELECT ur.id, r.code AS role_code
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.id = :userRoleId
        LIMIT 1`,
      { userRoleId }
    );
    return rows[0] ?? null;
  }

  async findRoleById(roleId: string) {
    const rows = await query<{ id: string; code: string }[]>(`SELECT id, code FROM roles WHERE id = :roleId`, {
      roleId,
    });
    return rows[0] ?? null;
  }

  async userHasRole(userId: string, roleCode: string) {
    const rows = await query<{ id: string }[]>(
      `SELECT ur.id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE
          AND r.code = :roleCode
        LIMIT 1`,
      { userId, roleCode }
    );
    return rows.length > 0;
  }

  async userHasPermission(userId: string, permissionCode: string) {
    const rows = await query<{ id: string }[]>(
      `SELECT rp.role_id AS id
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE
          AND p.code = :permissionCode
        LIMIT 1`,
      { userId, permissionCode }
    );
    return rows.length > 0;
  }
}
