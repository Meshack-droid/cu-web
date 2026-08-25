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
