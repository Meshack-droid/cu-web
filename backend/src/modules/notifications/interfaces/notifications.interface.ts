export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  channel: 'in_app' | 'email' | 'sms';
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}
