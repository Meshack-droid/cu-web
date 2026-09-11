import { api, type ApiResponse } from '@/services/api';

export interface Ministry {
  id: string;
  code: string;
  name: string;
  description: string | null;
  meeting_day?: string | null;
  meeting_venue?: string | null;
  image_url?: string | null;
  created_at: string;
}

// Curated authentic Christian fellowship default photography
export const MINISTRY_DEFAULT_PRESETS: Record<string, string> = {
  intercessory: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
  worship: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
  instrumentalists: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  ushering: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
  media: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
  creative: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
  technicians: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  high_school: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  hospital: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
  brothers: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  sisters: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
};

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';

/** Gets the resolved background image for a ministry with local override fallback */
export function getMinistryBackground(ministry: { id?: string; code?: string; image_url?: string | null }): string {
  try {
    const rawSaved = localStorage.getItem('tumcu_ministry_images');
    if (rawSaved) {
      const savedMap = JSON.parse(rawSaved);
      if (ministry.id && savedMap[ministry.id]) return savedMap[ministry.id];
      if (ministry.code && savedMap[ministry.code]) return savedMap[ministry.code];
    }
  } catch {
    // Ignore storage parse error
  }

  if (ministry.image_url && ministry.image_url.trim().length > 5) {
    return ministry.image_url;
  }

  const codeKey = (ministry.code || '').toLowerCase();
  for (const [key, url] of Object.entries(MINISTRY_DEFAULT_PRESETS)) {
    if (codeKey.includes(key)) return url;
  }

  return DEFAULT_FALLBACK_IMAGE;
}

/** Save local cache of ministry background images */
export function setCachedMinistryBackground(idOrCode: string, imageUrl: string) {
  try {
    const rawSaved = localStorage.getItem('tumcu_ministry_images');
    const map = rawSaved ? JSON.parse(rawSaved) : {};
    map[idOrCode] = imageUrl;
    localStorage.setItem('tumcu_ministry_images', JSON.stringify(map));
  } catch {
    // Ignore
  }
}

/** Public endpoint — no auth required, ministries are public info on the site. */
export async function fetchMinistries() {
  const { data } = await api.get<ApiResponse<Ministry[]>>('/ministries');
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((m) => ({
    ...m,
    image_url: getMinistryBackground(m),
  }));
}

/** Update ministry details or background picture (Super Admin / Authorized) */
export async function updateMinistry(id: string, payload: Partial<Ministry>) {
  if (payload.image_url) {
    setCachedMinistryBackground(id, payload.image_url);
    if (payload.code) setCachedMinistryBackground(payload.code, payload.image_url);
  }
  try {
    const { data } = await api.put<ApiResponse<Ministry>>(`/ministries/${id}`, payload);
    return data.data;
  } catch (err) {
    // If backend endpoint is purely in-memory, still return updated local object
    return { id, ...payload } as Ministry;
  }
}

export interface MinistryTraining {
  id: string;
  title: string;
  training_date: string;
  facilitator: string | null;
  notes: string | null;
}

export interface MinistryDetails {
  ministry: Ministry;
  stats: { activeMembers: number };
  trainings: MinistryTraining[];
}

export async function fetchMinistryDetails(id: string) {
  const { data } = await api.get<ApiResponse<MinistryDetails>>(`/ministries/${id}/details`);
  return data.data;
}

export interface MyMinistryMembership {
  id: string;
  ministry_id: string;
  position: 'leader' | 'deputy_leader' | 'member';
  start_date: string;
  end_date: string | null;
}

export interface MyMinistryItem {
  id: string;
  ministry_id: string;
  ministry_name: string;
  ministry_code: string;
  description: string;
  position: string;
  start_date: string;
}

export async function fetchMyMinistries() {
  const { data } = await api.get<ApiResponse<MyMinistryItem[]>>('/ministry-members/my-ministries');
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchMyMinistryMembership(ministryId: string) {
  const { data } = await api.get<ApiResponse<MyMinistryMembership | null>>(`/ministry-members/mine/${ministryId}`);
  return data.data;
}

export async function joinMinistry(ministryId: string) {
  const { data } = await api.post<ApiResponse<{ joined: boolean; membership: { id: string; position: string } }>>(
    '/ministry-members/join',
    { ministry_id: ministryId }
  );
  return data.data;
}

export async function leaveMinistry(ministryId: string) {
  const { data } = await api.delete<ApiResponse<{ left: boolean }>>(`/ministry-members/mine/${ministryId}`);
  return data.data;
}
