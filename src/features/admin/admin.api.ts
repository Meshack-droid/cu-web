import { api, type ApiResponse } from '@/services/api';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  admission_number: string | null;
  account_status: string;
  phone?: string | null;
  year_of_study?: string | number | null;
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

export async function fetchRoleAssignments() {
  const { data } = await api.get<ApiResponse<UserRoleAssignment[]>>('/admin/user-roles');
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

export async function terminateRole(userRoleId: string) {
  return revokeRole(userRoleId);
}

export interface DashboardSummaryData {
  stats: {
    total_members: number;
    active_leaders: number;
    upcoming_events: number;
    pending_applications: number;
    vacancies_count: number;
    meetings_awaiting_minutes: number;
    finance_awaiting_action: number;
  };
  needs_attention: {
    membership_applications: Array<{
      id: string;
      user_id: string;
      full_name: string;
      admission_number: string;
      course: string;
      year_of_study: number;
      school?: string;
      status: string;
      created_at: string;
    }>;
    leadership_vacancies: Array<{
      id: string;
      position_id: string;
      position_name?: string;
      position_code?: string;
      constitutional_reference?: string;
      status: string;
      vacancy_reason?: string;
      vacancy_date?: string;
    }>;
    meetings_awaiting_minutes: Array<{
      id: string;
      title: string;
      meeting_date: string;
      start_time: string;
      venue: string;
      category: string;
      status: string;
      agenda?: string;
    }>;
    finance_resolutions: Array<{
      id: string;
      resolution_number: string;
      title: string;
      amount: number;
      category: string;
      signatory_1: string;
      signatory_2: string;
      status: string;
      date_resolved: string;
    }>;
  };
  this_week_schedule: Array<{
    id: string;
    title: string;
    date: string;
    time?: string;
    location?: string;
    category?: string;
  }>;
}

export async function fetchDashboardSummary() {
  const { data } = await api.get<ApiResponse<DashboardSummaryData>>('/admin/dashboard-summary');
  return data.data;
}

export interface SystemHealthData {
  database: {
    status: string;
    engine: string;
    latency_ms: number;
    connected: boolean;
    tables_loaded: number;
    active_pool_connections: number;
    idle_pool_connections: number;
  };
  auth: {
    status: string;
    jwt_token_version: string;
    active_sessions_estimate: number;
    failed_login_attempts_24h: number;
    enforce_password_complexity: boolean;
  };
  governance_engine: {
    status: string;
    constitutional_enforcement_active: boolean;
    positions_defined: number;
    active_assignments: number;
    vacancies_flagged: number;
    financial_separation_of_powers: string;
  };
  scheduler: {
    status: string;
    active_cron_jobs: string[];
    last_heartbeat: string;
  };
  audit_summary: {
    events_recorded_today: number;
    security_alerts: number;
    unauthorized_access_attempts: number;
  };
}

export async function fetchSystemHealth() {
  const { data } = await api.get<ApiResponse<SystemHealthData>>('/admin/system-health');
  return data.data;
}

export interface CustomCommittee {
  id: string;
  name: string;
  purpose: string;
  start_date: string;
  end_date: string;
  chairperson_name: string;
  secretary_name?: string;
  member_count: number;
  status: string;
}

export async function fetchCustomCommittees() {
  const { data } = await api.get<ApiResponse<CustomCommittee[]>>('/admin/custom-committees');
  return data.data;
}

export async function createCustomCommittee(payload: {
  name: string;
  purpose: string;
  startDate: string;
  endDate: string;
  chairpersonName: string;
  secretaryName?: string;
  memberCount?: number;
}) {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/admin/custom-committees', payload);
  return data.data;
}

export interface FinanceResolution {
  id: string;
  resolution_number: string;
  title: string;
  amount: number;
  category: string;
  signatory_1: string;
  signatory_2: string;
  status: string;
  date_resolved: string;
}

export async function fetchFinanceResolutions() {
  const { data } = await api.get<ApiResponse<FinanceResolution[]>>('/admin/finance-resolutions');
  return data.data;
}

export async function signFinanceResolution(id: string, signatoryName: string) {
  const { data } = await api.post<ApiResponse<{ id: string; status: string }>>(
    `/admin/finance-resolutions/${id}/sign`,
    { signatoryName }
  );
  return data.data;
}

