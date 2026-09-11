import { query } from '../../../config/database';
import { Notification } from '../interfaces/notifications.interface';

export interface UnsentNotification extends Notification {
  user_email: string;
}

export class NotificationsRepository {
  /** Notifications that have been queued (by an approval, etc.) but never dispatched. */
  async findUnsent(limit: number): Promise<UnsentNotification[]> {
    return query<UnsentNotification[]>(
      `SELECT n.*, u.email AS user_email
         FROM notifications n
         JOIN users u ON u.id = n.user_id
        WHERE n.sent_at IS NULL
        ORDER BY n.created_at ASC
        LIMIT :limit`,
      { limit }
    );
  }

  async markSent(id: string): Promise<void> {
    await query(`UPDATE notifications SET sent_at = NOW() WHERE id = :id`, { id });
  }

  async listForUser(userId: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = :userId`,
      { userId }
    );
    const total = countRows[0]?.total ?? 0;
    const rows = await query<Notification[]>(
      `SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset }
    );
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await query(`UPDATE notifications SET read_at = NOW() WHERE id = :id AND user_id = :userId`, {
      id,
      userId,
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await query(`UPDATE notifications SET read_at = NOW() WHERE user_id = :userId AND read_at IS NULL`, {
      userId,
    });
  }

  async countUnread(userId: string): Promise<number> {
    const rows = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = :userId AND read_at IS NULL`,
      { userId }
    );
    return rows[0]?.count ?? 0;
  }
}
