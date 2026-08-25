import { api, type ApiResponse } from '@/services/api';

export interface Ministry {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

/** Public endpoint — no auth required, ministries are public info on the site. */
export async function fetchMinistries() {
  const { data } = await api.get<ApiResponse<Ministry[]>>('/ministries');
  return Array.isArray(data.data) ? data.data : [];
}

export interface MinistryTraining {
  id: string;
  title: string;
  training_date: string;
  facilitator: string | null;
  notes: string | null;
}

export interface MinistryDetails {
  ministry: Ministry;
  stats: { activeMembers: number };
  trainings: MinistryTraining[];
}

export async function fetchMinistryDetails(id: string) {
  const { data } = await api.get<ApiResponse<MinistryDetails>>(`/ministries/${id}/details`);
  return data.data;
}

export interface MyMinistryMembership {
  id: string;
  ministry_id: string;
  position: 'leader' | 'deputy_leader' | 'member';
  start_date: string;
  end_date: string | null;
}

export async function fetchMyMinistryMembership(ministryId: string) {
  const { data } = await api.get<ApiResponse<MyMinistryMembership | null>>(`/ministry-members/mine/${ministryId}`);
  return data.data;
}

export async function joinMinistry(ministryId: string) {
  const { data } = await api.post<ApiResponse<{ joined: boolean; membership: { id: string; position: string } }>>(
    '/ministry-members/join',
    { ministry_id: ministryId }
  );
  return data.data;
}

export async function leaveMinistry(ministryId: string) {
  const { data } = await api.delete<ApiResponse<{ left: boolean }>>(`/ministry-members/mine/${ministryId}`);
  return data.data;
}
