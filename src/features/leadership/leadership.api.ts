import { api, type ApiResponse } from '@/services/api';

export interface LeadershipPosition {
  id: string;
  code: string;
  name: string;
  category: 'executive' | 'committee' | 'ministry' | 'ad_hoc';
  description: string;
  constitutional_reference: string;
  is_executive: boolean;
  requires_gender_rule?: boolean;
  active: boolean;
  display_order: number;
  responsibilities: string[];
  permissions: string[];
  constitutional_restrictions: string[];
}

export interface LeadershipAssignment {
  id: string;
  position_id: string;
  user_id: string | null;
  academic_year: string;
  assignment_type: 'permanent' | 'acting' | 'co-opted' | 'temporary';
  start_date: string;
  end_date: string;
  status: 'active' | 'vacant' | 'ended' | 'suspended';
  vacancy_reason?: string | null;
  vacancy_date?: string | null;
  notes?: string | null;
  created_at: string;
  // Joined fields:
  position_name?: string;
  position_code?: string;
  position_category?: string;
  constitutional_reference?: string;
  responsibilities?: string[];
  permissions?: string[];
  constitutional_restrictions?: string[];
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_admission_number?: string;
  user_course?: string;
  user_year?: number | string;
}

export interface LeaderResponsibilitiesView {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    admission_number: string;
  };
  positions: LeadershipAssignment[];
  all_responsibilities: string[];
  permissions: string[];
  constitutional_restrictions: string[];
  pending_attention: {
    membership_applications: number;
    leadership_vacancies: number;
    meetings_awaiting_minutes: number;
    finance_awaiting_action: number;
  };
}

export interface LeadershipOverview {
  total: number;
  active: number;
  vacant: number;
  positions_count: number;
  vacancies: LeadershipAssignment[];
  tenure_academic_year: string;
  completion_percentage: number;
}

export async function fetchLeadershipPositions(): Promise<LeadershipPosition[]> {
  const { data } = await api.get<ApiResponse<LeadershipPosition[]>>('/leadership/positions');
  return data.data;
}

export async function fetchLeadershipAssignments(filters: {
  status?: string;
  positionId?: string;
  userId?: string;
} = {}): Promise<LeadershipAssignment[]> {
  const { data } = await api.get<ApiResponse<LeadershipAssignment[]>>('/leadership/assignments', {
    params: filters,
  });
  return data.data;
}

export async function assignLeader(payload: {
  positionId: string;
  userId: string;
  assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
  academicYear?: string;
  notes?: string;
}): Promise<{ id: string }> {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/leadership/assignments', payload);
  return data.data;
}

export async function appointReplacement(
  positionId: string,
  payload: {
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    notes?: string;
  }
): Promise<{ id: string }> {
  const { data } = await api.post<ApiResponse<{ id: string }>>(`/leadership/positions/${positionId}/appoint`, payload);
  return data.data;
}

export async function updateLeadershipAssignment(
  id: string,
  payload: Partial<LeadershipAssignment>
): Promise<void> {
  await api.put(`/leadership/assignments/${id}`, payload);
}

export async function revokeLeadershipAssignment(id: string, reason?: string): Promise<void> {
  await api.delete(`/leadership/assignments/${id}`, { data: { reason } });
}

export async function fetchMyResponsibilities(): Promise<LeaderResponsibilitiesView> {
  const { data } = await api.get<ApiResponse<LeaderResponsibilitiesView>>('/leadership/my-responsibilities');
  return data.data;
}

export async function fetchLeadershipOverview(): Promise<LeadershipOverview> {
  const { data } = await api.get<ApiResponse<LeadershipOverview>>('/leadership/overview');
  return data.data;
}
