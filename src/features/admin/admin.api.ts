import { api, type ApiResponse } from '@/services/api';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  admission_number: string | null;
  account_status: string;
}

export interface RoleOption {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface RolePermissionMatrixRow {
  role_id: string;
  role_code: string;
  role_name: string;
  category: string;
  permission_code: string;
  permission_module: string;
  permission_description: string | null;
}

export interface ScopeOption {
  id: string;
  name: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  full_name: string;
  role_id: string;
  role_code: string;
  role_name: string;
  scope_type: 'global' | 'committee' | 'ministry' | 'executive';
  scope_id: string | null;
  scope_name: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | number;
}

export async function searchUsers(q: string) {
  const { data } = await api.get<ApiResponse<AdminUser[]>>('/admin/users/search', { params: { q } });
  return data.data;
}

export async function fetchRoles() {
  const { data } = await api.get<ApiResponse<RoleOption[]>>('/admin/roles');
  return data.data;
}

export async function fetchRolePermissionMatrix() {
  const { data } = await api.get<ApiResponse<RolePermissionMatrixRow[]>>('/admin/role-permissions');
  return data.data;
}

export async function fetchMinistries() {
  const { data } = await api.get<ApiResponse<ScopeOption[]>>('/admin/ministries');
  return data.data;
}

export async function fetchCommittees() {
  const { data } = await api.get<ApiResponse<ScopeOption[]>>('/admin/committees');
  return data.data;
}

export async function fetchUserRoles(userId: string) {
  const { data } = await api.get<ApiResponse<UserRoleAssignment[]>>('/admin/user-roles', {
    params: { userId },
  });
  return data.data;
}

export interface AssignRolePayload {
  userId: string;
  roleId: string;
  scopeType: 'global' | 'committee' | 'ministry' | 'executive';
  scopeId?: string | null;
}

export async function assignRole(payload: AssignRolePayload) {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/admin/user-roles', payload);
  return data.data;
}

export async function revokeRole(userRoleId: string) {
  await api.delete(`/admin/user-roles/${userRoleId}`);
}
