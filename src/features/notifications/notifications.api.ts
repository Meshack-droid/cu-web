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

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const { data } = await api.get<any>('/notifications');
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data?.data?.rows)) {
      return data.data.rows;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    return [];
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get<any>('/notifications/unread-count');
    const count = data?.data?.count ?? data?.count ?? 0;
    return typeof count === 'number' ? count : 0;
  } catch (err) {
    console.error('Failed to fetch unread notifications count:', err);
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await api.post(`/notifications/${id}/read`);
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api.post('/notifications/read-all');
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
  }
}

