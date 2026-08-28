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

export type AttendanceMethod =
  | 'qr'
  | 'qr_code'
  | 'manual'
  | 'nfc'
  | 'mobile_app'
  | 'self_check_in'
  | 'leader_check_in'
  | 'guest_registration';

export type VisitorType = 'none' | 'first_time' | 'returning' | 'visitor';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

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
  method: AttendanceMethod;
  visitor_type: VisitorType;
  checked_in_at: string | null;
  notes?: string | null;
  prayer_request?: string | null;
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
  method: AttendanceMethod;
  checked_in_at: string;
  notes?: string | null;
  prayer_request?: string | null;
  school_faculty?: string | null;
  year_of_study?: string | number | null;
}

