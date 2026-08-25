import { api, type ApiResponse } from '@/services/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  channel: 'in_app' | 'email' | 'sms';
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export async function fetchNotifications() {
  const { data } = await api.get<ApiResponse<Notification[]>>('/notifications');
  return data.data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(id: string) {
  await api.post(`/notifications/${id}/read`);
}
