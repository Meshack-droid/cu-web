import { api } from '@/services/api';

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  series: string;
  scripture: string;
  audio_url?: string | null;
  duration?: string;
  description: string;
  notes_pdf_url?: string | null;
  created_at: string;
}

export interface GivingRecord {
  id: string;
  donor_name: string;
  admission_number?: string;
  category: 'Tithe' | 'Offering' | 'Missions' | 'Welfare' | 'Music' | 'Building';
  amount: number;
  mpesa_code: string;
  payment_method: string;
  created_at: string;
}

export async function fetchSermons(search?: string, series?: string): Promise<Sermon[]> {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (series) params.series = series;
  const res = await api.get('/sermons', { params });
  return res.data.data;
}

export async function createSermon(payload: Partial<Sermon>): Promise<Sermon> {
  const res = await api.post('/sermons', payload);
  return res.data.data;
}

export async function updateSermon(id: string, payload: Partial<Sermon>): Promise<Sermon> {
  const res = await api.put(`/sermons/${id}`, payload);
  return res.data.data;
}

export async function deleteSermon(id: string): Promise<{ id: string }> {
  const res = await api.delete(`/sermons/${id}`);
  return res.data.data;
}

export async function fetchGivingList(): Promise<GivingRecord[]> {
  const res = await api.get('/sermons/giving/list');
  return res.data.data;
}

export async function recordGiving(payload: {
  donor_name: string;
  admission_number?: string;
  category: string;
  amount: number;
  mpesa_code: string;
}): Promise<GivingRecord> {
  const res = await api.post('/sermons/giving', payload);
  return res.data.data;
}

export async function downloadGivingReportCsv(): Promise<void> {
  const res = await api.get('/sermons/giving/export', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TUMCU_Giving_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
