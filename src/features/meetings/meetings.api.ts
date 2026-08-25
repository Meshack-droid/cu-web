import { api, type ApiResponse } from '@/services/api';

export type MeetingType =
  | 'agm' | 'sgm' | 'regular_general' | 'executive' | 'advisory_board' | 'ministry' | 'committee';
export type MeetingStatus = 'draft' | 'notice_sent' | 'scheduled' | 'held' | 'cancelled' | 'archived';

export interface Meeting {
  id: string;
  title: string;
  meeting_type: MeetingType;
  theme: string | null;
  scheduled_at: string;
  venue: string | null;
  status: MeetingStatus;
  called_by: string;
}

export interface AgendaItem {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  is_voting_item: boolean;
  display_order: number;
}

export interface MeetingMinutes {
  id: string;
  meeting_id: string;
  content: string;
  approved_at: string | null;
  approved_by: string | null;
}

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  agm: 'AGM',
  sgm: 'SGM',
  regular_general: 'Regular General Meeting',
  executive: 'Executive Meeting',
  advisory_board: 'Advisory Board Meeting',
  ministry: 'Ministry Meeting',
  committee: 'Committee Meeting',
};

export async function fetchMeetings() {
  const { data } = await api.get<ApiResponse<Meeting[]>>('/meetings');
  return data.data;
}

export async function createMeeting(payload: {
  title: string;
  meeting_type: MeetingType;
  scheduled_at: string;
  venue?: string;
}) {
  const { data } = await api.post<ApiResponse<Meeting>>('/meetings', { ...payload, status: 'scheduled' });
  return data.data;
}

export async function fetchAgenda(meetingId: string) {
  const { data } = await api.get<ApiResponse<AgendaItem[]>>(`/meetings/${meetingId}/agenda`);
  return data.data;
}

export async function addAgendaItem(meetingId: string, title: string) {
  const { data } = await api.post<ApiResponse<AgendaItem>>(`/meetings/${meetingId}/agenda`, { title });
  return data.data;
}

export async function fetchMinutes(meetingId: string) {
  const { data } = await api.get<ApiResponse<MeetingMinutes | null>>(`/meetings/${meetingId}/minutes`);
  return data.data;
}

export async function recordMinutes(meetingId: string, content: string) {
  const { data } = await api.post<ApiResponse<MeetingMinutes>>(`/meetings/${meetingId}/minutes`, { content });
  return data.data;
}

export async function approveMinutes(meetingId: string) {
  const { data } = await api.post<ApiResponse<MeetingMinutes>>(`/meetings/${meetingId}/minutes/approve`);
  return data.data;
}

export async function confirmAttendance(meetingId: string) {
  await api.post(`/meetings/${meetingId}/attendance`, { method: 'manual' });
}

export async function archiveMeeting(meetingId: string) {
  const { data } = await api.post<ApiResponse<Meeting>>(`/meetings/${meetingId}/archive`);
  return data.data;
}
