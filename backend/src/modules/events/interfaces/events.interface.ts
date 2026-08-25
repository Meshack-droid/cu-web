export type EventType =
  | 'worship_night' | 'missions' | 'evangelism' | 'high_school_mission' | 'retreat'
  | 'conference' | 'leadership_summit' | 'bible_study' | 'prayer_retreat' | 'training'
  | 'agm' | 'sgm' | 'camp' | 'graduation_thanksgiving' | 'other';

export type EventStatus = 'draft' | 'budgeted' | 'approved' | 'registration_open' | 'ongoing' | 'completed' | 'archived';

export interface Event {
  id: string;
  title: string;
  event_type: EventType;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  organized_by: string;
  status: EventStatus;
  capacity: number | null;
  registration_deadline: string | null;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null;
  walk_in_name: string | null;
  registration_type: 'online' | 'walk_in';
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended';
  qr_code: string | null;
  registered_at: string;
}
