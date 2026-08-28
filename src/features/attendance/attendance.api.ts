import { api, type ApiResponse } from '@/services/api';

export type AttendableType =
  | 'sunday_service'
  | 'meeting'
  | 'event'
  | 'ministry_session'
  | 'committee_session'
  | 'programme'
  | 'training'
  | 'outreach'
  | 'kesha'
  | 'bible_study';

export type VisitorType = 'none' | 'first_time' | 'returning' | 'visitor';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface AttendanceRecord {
  id: string;
  session_id?: string;
  attendable_type: AttendableType;
  attendable_id: string;
  user_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  guest_category?: string | null;
  status: AttendanceStatus;
  method: string;
  visitor_type: VisitorType;
  checked_in_at: string | null;
  notes?: string | null;
  prayer_request?: string | null;
}

export interface AttendanceSession {
  id: string;
  code: string;
  title: string;
  session_type: string;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  venue: string;
  theme?: string | null;
  preacher?: string | null;
  is_active: number | boolean;
  attendees_count?: number;
  members_count?: number;
  visitors_count?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendeeRosterItem {
  id: string;
  session_id?: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone_number: string;
  admission_number?: string;
  membership_number?: string;
  is_member: boolean;
  status: AttendanceStatus;
  visitor_type: VisitorType;
  method: string;
  checked_in_at: string;
  notes?: string | null;
  prayer_request?: string | null;
  school_faculty?: string | null;
  year_of_study?: string | number | null;
}

export interface CheckInResult {
  success: boolean;
  is_member: boolean;
  message: string;
  prompt_registration: boolean;
  user?: {
    id: string;
    full_name: string;
    email: string;
    admission_number?: string;
  };
  guest?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    visitorType?: string;
  };
  record: AttendanceRecord;
}

export const ATTENDABLE_TYPE_LABELS: Record<AttendableType, string> = {
  sunday_service: 'Sunday Service',
  meeting: 'Meeting',
  event: 'Event',
  ministry_session: 'Ministry Session',
  committee_session: 'Committee Session',
  programme: 'Weekly Programme',
  training: 'Training',
  outreach: 'Outreach',
  kesha: 'Prayer Kesha',
  bible_study: 'Bible Study Fellowship',
};

export async function fetchMyAttendance() {
  const { data } = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/me');
  return data.data;
}

export async function fetchAttendanceSessions() {
  const { data } = await api.get<ApiResponse<AttendanceSession[]>>('/attendance/sessions');
  return data.data;
}

export async function fetchActivePublicSessions() {
  const { data } = await api.get<ApiResponse<AttendanceSession[]>>('/attendance/public/sessions/active');
  return data.data;
}

export async function fetchSessionDetails(idOrCode: string) {
  const { data } = await api.get<ApiResponse<AttendanceSession>>(`/attendance/public/sessions/${idOrCode}`);
  return data.data;
}

export async function createAttendanceSession(payload: {
  title: string;
  session_type: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  venue: string;
  theme?: string;
  preacher?: string;
}) {
  const { data } = await api.post<ApiResponse<AttendanceSession>>('/attendance/sessions', payload);
  return data.data;
}

export async function toggleSessionStatus(id: string, is_active: boolean) {
  const { data } = await api.put<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}`, {
    is_active: is_active ? 1 : 0,
  });
  return data.data;
}

export async function fetchSessionRoster(sessionId: string) {
  const { data } = await api.get<ApiResponse<AttendeeRosterItem[]>>(`/attendance/sessions/${sessionId}/roster`);
  return data.data;
}

export async function submitPublicCheckIn(payload: {
  sessionId?: string;
  sessionCode?: string;
  identifier?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  category?: string;
  visitorType?: 'first_time' | 'returning';
  prayerRequest?: string;
  notes?: string;
}) {
  const { data } = await api.post<ApiResponse<CheckInResult>>('/attendance/public/check-in', payload);
  return data.data;
}

export async function selfCheckIn(attendableType: AttendableType, attendableId: string, options?: { prayerRequest?: string }) {
  const { data } = await api.post<ApiResponse<CheckInResult>>('/attendance/self-check-in', {
    attendableType,
    attendableId,
    prayerRequest: options?.prayerRequest,
  });
  return data.data;
}

export async function manualLeaderCheckIn(payload: {
  sessionId: string;
  attendableType?: string;
  userId?: string | null;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  category?: string;
  visitorType?: string;
  prayerRequest?: string;
  notes?: string;
}) {
  const { data } = await api.post<ApiResponse<CheckInResult>>('/attendance/manual-check-in', payload);
  return data.data;
}

export async function downloadAttendanceCsv(sessionId: string, sessionTitle?: string, sessionDate?: string) {
  const response = await api.get(`/attendance/sessions/${sessionId}/export`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (sessionTitle || 'Sunday_Service_Attendance').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.href = url;
  link.setAttribute('download', `TUMCU_Attendance_${safeName}_${sessionDate || 'Report'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

