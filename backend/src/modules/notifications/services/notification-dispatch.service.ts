import { NotificationsRepository } from '../repositories/notifications.repository';
import { EmailProvider, createEmailProvider } from './email-provider';
import { logger } from '../../../utils/logger';

const BATCH_SIZE = 25;

export class NotificationDispatchService {
  constructor(
    private readonly repository: NotificationsRepository = new NotificationsRepository(),
    private readonly emailProvider: EmailProvider = createEmailProvider()
  ) {}

  /**
   * Sends every currently-unsent notification and marks each one sent_at as
   * it succeeds. A failure on one notification is logged and skipped
   * (stays unsent, retried on the next dispatch cycle) rather than
   * aborting the whole batch — one bad email address shouldn't block
   * everyone else's approval notice.
   */
  async dispatchPending(): Promise<{ sent: number; failed: number }> {
    const pending = await this.repository.findUnsent(BATCH_SIZE);
    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        // Only 'email' and 'in_app' are meaningfully actionable today (SMS
        // has no provider wired up yet) — in_app notifications need no
        // dispatch step at all, they're just marked sent immediately since
        // the frontend reads them directly from the table.
        if (notification.channel === 'email') {
          await this.emailProvider.send({
            to: notification.user_email,
            subject: notification.title,
            body: notification.body ?? notification.title,
          });
        }
        await this.repository.markSent(notification.id);
        sent++;
      } catch (err) {
        logger.error({ err, notificationId: notification.id }, 'Failed to dispatch notification');
        failed++;
      }
    }

    if (sent > 0 || failed > 0) {
      logger.info({ sent, failed }, 'Notification dispatch cycle complete');
    }

    return { sent, failed };
  }

  listForUser(userId: string, page = 1, pageSize = 20) {
    return this.repository.listForUser(userId, page, pageSize);
  }

  markRead(id: string, userId: string) {
    return this.repository.markRead(id, userId);
  }

  markAllRead(userId: string) {
    return this.repository.markAllRead(userId);
  }

  countUnread(userId: string) {
    return this.repository.countUnread(userId);
  }
}

/** Runs dispatchPending() on an interval for the lifetime of the process. Returns a stop function. */
export function startNotificationDispatcher(intervalMs: number): () => void {
  const service = new NotificationDispatchService();
  const timer = setInterval(() => {
    service.dispatchPending().catch((err) => logger.error({ err }, 'Notification dispatch cycle crashed'));
  }, intervalMs);
  // Also run once immediately on startup rather than waiting a full interval.
  service.dispatchPending().catch((err) => logger.error({ err }, 'Initial notification dispatch failed'));
  return () => clearInterval(timer);
}
