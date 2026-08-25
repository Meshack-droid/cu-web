export type PrayerPrivacyLevel = 'public' | 'prayer_team' | 'executive_only' | 'private';
export type PrayerRequestStatus = 'open' | 'being_prayed_for' | 'answered' | 'closed';

export interface PrayerRequest {
  id: string;
  requested_by: string | null;
  title: string;
  details: string;
  privacy_level: PrayerPrivacyLevel;
  status: PrayerRequestStatus;
  created_at: string;
}
