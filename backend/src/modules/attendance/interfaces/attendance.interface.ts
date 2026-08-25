export type AttendableType =
  | 'meeting'
  | 'event'
  | 'ministry_session'
  | 'committee_session'
  | 'programme'
  | 'training'
  | 'outreach';

export type AttendanceMethod = 'qr' | 'manual' | 'nfc' | 'mobile_app' | 'self_check_in' | 'leader_check_in';
export type VisitorType = 'none' | 'first_time' | 'returning';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface AttendanceRecord {
  id: string;
  attendable_type: AttendableType;
  attendable_id: string;
  user_id: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  visitor_type: VisitorType;
  checked_in_at: string | null;
}
