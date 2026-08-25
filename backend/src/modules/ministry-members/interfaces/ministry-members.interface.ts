export interface MinistryMember {
  id: string;
  ministry_id: string;
  user_id: string;
  position: 'leader' | 'deputy_leader' | 'member';
  spiritual_year_id: string;
  start_date: string;
  end_date: string | null;
}
