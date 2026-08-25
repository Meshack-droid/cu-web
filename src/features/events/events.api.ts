import { api, type ApiResponse } from '@/services/api';

export interface PublicEvent {
  id: string;
  title: string;
  event_type: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  status: string;
  capacity: number | null;
}

/** Public endpoint — only approved/open/ongoing/completed events, never drafts. */
export async function fetchPublicEvents() {
  const { data } = await api.get<ApiResponse<PublicEvent[]>>('/events/public');
  return data.data;
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  worship_night: 'Worship Night',
  missions: 'Missions',
  evangelism: 'Evangelism',
  high_school_mission: 'High School Mission',
  retreat: 'Retreat',
  conference: 'Conference',
  leadership_summit: 'Leadership Summit',
  bible_study: 'Bible Study',
  prayer_retreat: 'Prayer Retreat',
  training: 'Training',
  agm: 'AGM',
  sgm: 'SGM',
  camp: 'Camp',
  graduation_thanksgiving: 'Graduation Thanksgiving',
  other: 'Event',
};
