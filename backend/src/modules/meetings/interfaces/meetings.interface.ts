export type MeetingType =
  | 'agm'
  | 'sgm'
  | 'regular_general'
  | 'executive'
  | 'advisory_board'
  | 'ministry'
  | 'committee';

export type MeetingStatus = 'draft' | 'notice_sent' | 'scheduled' | 'held' | 'cancelled' | 'archived';

export interface Meeting {
  id: string;
  title: string;
  meeting_type: MeetingType;
  theme: string | null;
  description: string | null;
  scheduled_at: string;
  venue: string | null;
  chairperson_id: string | null;
  secretary_id: string | null;
  expected_attendance: number | null;
  quorum_requirement: number | null;
  constitution_reference: string | null;
  called_by: string;
  status: MeetingStatus;
  created_at: string;
}

export interface AgendaItem {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  is_voting_item: boolean;
  presenter_id: string | null;
  time_allocated_minutes: number | null;
  display_order: number;
}

export interface Resolution {
  id: string;
  meeting_id: string;
  resolution_number: string | null;
  description: string;
  motion: string | null;
  mover_id: string | null;
  seconder_id: string | null;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  status: 'pending' | 'in_progress' | 'completed';
  responsible_user_id: string | null;
  due_date: string | null;
}

export interface MeetingMinutes {
  id: string;
  meeting_id: string;
  recorded_by: string;
  content: string;
  ai_summary: string | null;
  approved_at: string | null;
  approved_by: string | null;
}
