import { api, type ApiResponse } from '@/services/api';

export type PrayerPrivacyLevel = 'public' | 'prayer_team' | 'executive_only' | 'private';
export type PrayerStatus = 'open' | 'being_prayed_for' | 'answered' | 'closed';

export interface PrayerRequest {
  id: string;
  requested_by: string | null;
  title: string;
  details: string;
  privacy_level: PrayerPrivacyLevel;
  status: PrayerStatus;
  created_at: string;
}

export const PRIVACY_LABELS: Record<PrayerPrivacyLevel, string> = {
  public: 'Public',
  prayer_team: 'Prayer Team Only',
  executive_only: 'Executive Only',
  private: 'Private',
};

export const STATUS_LABELS: Record<PrayerStatus, string> = {
  open: 'Open',
  being_prayed_for: 'Being Prayed For',
  answered: 'Answered',
  closed: 'Closed',
};

export async function fetchPrayerRequests() {
  const { data } = await api.get<ApiResponse<PrayerRequest[]>>('/prayer-requests');
  return data.data;
}

export async function submitPrayerRequest(payload: {
  title: string;
  details: string;
  privacyLevel: PrayerPrivacyLevel;
  anonymous: boolean;
}) {
  const { data } = await api.post<ApiResponse<PrayerRequest>>('/prayer-requests', payload);
  return data.data;
}

export async function updatePrayerRequestStatus(id: string, status: PrayerStatus) {
  const { data } = await api.put<ApiResponse<PrayerRequest>>(`/prayer-requests/${id}`, { status });
  return data.data;
}
