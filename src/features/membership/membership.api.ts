import { api, type ApiResponse } from '@/services/api';

export interface Membership {
  id: string;
  membership_number: string;
  membership_type_id: string;
  spiritual_year_id: string;
  status: 'pending' | 'active' | 'expired' | 'suspended';
  registration_date: string;
  renewal_date: string | null;
}

export interface MembershipApplication {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export interface MyMembershipStatus {
  memberships: Membership[];
  applications: MembershipApplication[];
}

export async function fetchMyMembershipStatus() {
  const { data } = await api.get<ApiResponse<MyMembershipStatus>>('/membership/me');
  return data.data;
}

export interface PendingApplication {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  user_id: string;
  full_name: string;
  email: string;
  admission_number: string | null;
  membership_type_name: string;
}

export async function fetchPendingApplications() {
  const statuses = ['submitted', 'under_review'];
  const responses = await Promise.all(
    statuses.map((status) =>
      api.get<ApiResponse<PendingApplication[]>>('/membership/applications', {
        params: { status, page: 1, pageSize: 100 },
      })
    )
  );

  const merged = responses.flatMap((response) => response.data.data);
  return merged.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function approveApplication(applicationId: string) {
  const { data } = await api.post<ApiResponse<Membership>>(
    `/membership/applications/${applicationId}/approve`,
    {}
  );
  return data.data;
}

export async function rejectApplication(applicationId: string, rejectionReason: string) {
  const { data } = await api.post<ApiResponse<PendingApplication>>(
    `/membership/applications/${applicationId}/reject`,
    { rejectionReason }
  );
  return data.data;
}

export interface MemberListItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  admission_number: string;
  year_of_study: string;
  department: string;
  membership_number: string;
  membership_type: string;
  status: string;
  registration_date: string;
  role_name: string;
  ministries: string;
}

export async function fetchAllMembers(filters?: {
  search?: string;
  yearOfStudy?: string;
  department?: string;
  status?: string;
}): Promise<MemberListItem[]> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.yearOfStudy) params.year_of_study = filters.yearOfStudy;
  if (filters?.department) params.department = filters.department;
  if (filters?.status) params.status = filters.status;

  const { data } = await api.get<ApiResponse<MemberListItem[]>>('/membership/all-members', { params });
  return data.data;
}

export async function deleteMemberApi(memberId: string): Promise<void> {
  await api.delete(`/membership/${memberId}`);
}

export async function downloadMembershipCsv(): Promise<void> {
  const res = await api.get('/membership/export', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TUMCU_Membership_Register_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

