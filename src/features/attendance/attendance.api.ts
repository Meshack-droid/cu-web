import { api, type ApiResponse } from '@/services/api';

export type AttendableType =
  | 'meeting' | 'event' | 'ministry_session' | 'committee_session' | 'programme' | 'training' | 'outreach';

export interface AttendanceRecord {
  id: string;
  attendable_type: AttendableType;
  attendable_id: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  method: string;
  checked_in_at: string | null;
}

export const ATTENDABLE_TYPE_LABELS: Record<AttendableType, string> = {
  meeting: 'Meeting',
  event: 'Event',
  ministry_session: 'Ministry Session',
  committee_session: 'Committee Session',
  programme: 'Weekly Programme',
  training: 'Training',
  outreach: 'Outreach',
};

export async function fetchMyAttendance() {
  const { data } = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/me');
  return data.data;
}

export async function selfCheckIn(attendableType: AttendableType, attendableId: string) {
  const { data } = await api.post<ApiResponse<AttendanceRecord>>('/attendance/self-check-in', {
    attendableType,
    attendableId,
  });
  return data.data;
}
