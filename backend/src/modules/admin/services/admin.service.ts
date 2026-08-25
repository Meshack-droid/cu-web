import { AdminRepository } from '../repositories/admin.repository';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../../utils/errors';

// Roles that MUST be scoped to a specific ministry — assigning them
// globally would be meaningless ("Ministry Leader of... everything?").
const MINISTRY_SCOPED_ROLE_CODES = ['ministry_leader', 'ministry_secretary', 'ministry_treasurer'];

// Committee chair roles must be scoped to their specific committee.
const COMMITTEE_SCOPED_ROLE_CODES = [
  'prayer_chairperson',
  'worship_chairperson',
  'missions_chairperson',
  'discipleship_chairperson',
  'assets_chairperson',
  'non_residents_chairperson',
  'publicity_chairperson',
];

export class AdminService {
  constructor(private readonly repository: AdminRepository = new AdminRepository()) {}

  searchUsers(search: string, page = 1, pageSize = 20) {
    if (search.trim().length < 2) {
      throw new BusinessRuleError('Search term must be at least 2 characters');
    }
    return this.repository.searchUsers(search.trim(), page, pageSize);
  }

  listRoles() {
    return this.repository.listRoles();
  }

  listRolePermissionMatrix() {
    return this.repository.listRolePermissionMatrix();
  }

  listMinistries() {
    return this.repository.listMinistries();
  }

  listCommittees() {
    return this.repository.listCommittees();
  }

  listUserRoles(userId?: string) {
    return this.repository.listUserRoles(userId);
  }

  async assignRole(params: {
    userId: string;
    roleId: string;
    scopeType: 'global' | 'committee' | 'ministry' | 'executive';
    scopeId: string | null;
    assignedBy: string;
  }) {
    const role = await this.repository.findRoleById(params.roleId);
    if (!role) throw new NotFoundError('Role');

    // Technical roles are protected from accidental escalation. A
    // constitutional leader may assign operational leadership, but only a
    // user holding system.manage_roles may assign System Admin / IT Admin,
    // and only a Super Admin may assign another Super Admin.
    if (['system_admin', 'it_admin', 'super_admin'].includes(role.code)) {
      const canManageSystemRoles = await this.repository.userHasPermission(
        params.assignedBy,
        'system.manage_roles'
      );
      if (!canManageSystemRoles) {
        throw new BusinessRuleError('Only System Administrators can assign technical administrator roles');
      }

      if (role.code === 'super_admin') {
        const isSuperAdmin = await this.repository.userHasRole(params.assignedBy, 'super_admin');
        if (!isSuperAdmin) {
          throw new BusinessRuleError('Only a Super Administrator can assign another Super Administrator');
        }
      }
    }

    // Enforce that scoped roles are actually given a scope, and that
    // non-scoped roles aren't accidentally scoped to something meaningless.
    if (MINISTRY_SCOPED_ROLE_CODES.includes(role.code)) {
      if (params.scopeType !== 'ministry' || !params.scopeId) {
        throw new BusinessRuleError(`"${role.code}" must be assigned with a specific ministry`);
      }
    } else if (COMMITTEE_SCOPED_ROLE_CODES.includes(role.code)) {
      if (params.scopeType !== 'committee' || !params.scopeId) {
        throw new BusinessRuleError(`"${role.code}" must be assigned with a specific committee`);
      }
    } else if (params.scopeType !== 'global' && params.scopeType !== 'executive') {
      throw new BusinessRuleError(`"${role.code}" is not a ministry/committee-scoped role`);
    }

    const existing = await this.repository.findExistingCurrentAssignment(
      params.userId,
      params.roleId,
      params.scopeId
    );
    if (existing) {
      throw new ConflictError('This person already holds this role (in this scope)');
    }

    const id = await this.repository.assignRole(params);
    return { id };
  }

  async revokeRole(userRoleId: string, revokedBy: string) {
    const assignments = await this.repository.findUserRoleById(userRoleId);
    if (!assignments) throw new NotFoundError('Role assignment');

    if (['system_admin', 'it_admin', 'super_admin'].includes(assignments.role_code)) {
      const canManageSystemRoles = await this.repository.userHasPermission(revokedBy, 'system.manage_roles');
      if (!canManageSystemRoles) {
        throw new BusinessRuleError('Only System Administrators can end technical administrator roles');
      }
      if (assignments.role_code === 'super_admin') {
        const isSuperAdmin = await this.repository.userHasRole(revokedBy, 'super_admin');
        if (!isSuperAdmin) {
          throw new BusinessRuleError('Only a Super Administrator can end a Super Administrator role');
        }
      }
    }

    await this.repository.revokeRole(userRoleId);
  }
}
