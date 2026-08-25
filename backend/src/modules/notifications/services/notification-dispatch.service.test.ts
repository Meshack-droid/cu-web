import { describe, expect, it, vi } from 'vitest';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsRepository, UnsentNotification } from '../repositories/notifications.repository';
import { EmailProvider } from './email-provider';

function makeNotification(overrides: Partial<UnsentNotification> = {}): UnsentNotification {
  return {
    id: 'notif-1',
    user_id: 'user-1',
    user_email: 'someone@example.com',
    type: 'welcome',
    title: 'Welcome to TUMCU!',
    body: 'Your membership has been approved.',
    channel: 'email',
    read_at: null,
    sent_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationDispatchService.dispatchPending', () => {
  it('sends each unsent email notification and marks it sent', async () => {
    const notification = makeNotification();
    const repository = {
      findUnsent: vi.fn().mockResolvedValue([notification]),
      markSent: vi.fn().mockResolvedValue(undefined),
    };
    const emailProvider = { send: vi.fn().mockResolvedValue(undefined) };

    const service = new NotificationDispatchService(
      repository as unknown as NotificationsRepository,
      emailProvider as unknown as EmailProvider
    );

    const result = await service.dispatchPending();

    expect(emailProvider.send).toHaveBeenCalledWith({
      to: 'someone@example.com',
      subject: 'Welcome to TUMCU!',
      body: 'Your membership has been approved.',
    });
    expect(repository.markSent).toHaveBeenCalledWith('notif-1');
    expect(result).toEqual({ sent: 1, failed: 0 });
  });

  it('marks in_app notifications sent without calling the email provider', async () => {
    const notification = makeNotification({ channel: 'in_app' });
    const repository = {
      findUnsent: vi.fn().mockResolvedValue([notification]),
      markSent: vi.fn().mockResolvedValue(undefined),
    };
    const emailProvider = { send: vi.fn() };

    const service = new NotificationDispatchService(
      repository as unknown as NotificationsRepository,
      emailProvider as unknown as EmailProvider
    );

    await service.dispatchPending();

    expect(emailProvider.send).not.toHaveBeenCalled();
    expect(repository.markSent).toHaveBeenCalledWith('notif-1');
  });

  it('does not mark a notification sent if the email provider throws, and continues to the next one', async () => {
    const failing = makeNotification({ id: 'notif-fail' });
    const succeeding = makeNotification({ id: 'notif-ok' });
    const repository = {
      findUnsent: vi.fn().mockResolvedValue([failing, succeeding]),
      markSent: vi.fn().mockResolvedValue(undefined),
    };
    const emailProvider = {
      send: vi
        .fn()
        .mockRejectedValueOnce(new Error('SMTP connection refused'))
        .mockResolvedValueOnce(undefined),
    };

    const service = new NotificationDispatchService(
      repository as unknown as NotificationsRepository,
      emailProvider as unknown as EmailProvider
    );

    const result = await service.dispatchPending();

    expect(repository.markSent).not.toHaveBeenCalledWith('notif-fail');
    expect(repository.markSent).toHaveBeenCalledWith('notif-ok');
    expect(result).toEqual({ sent: 1, failed: 1 });
  });

  it('does nothing when there are no pending notifications', async () => {
    const repository = { findUnsent: vi.fn().mockResolvedValue([]), markSent: vi.fn() };
    const emailProvider = { send: vi.fn() };

    const service = new NotificationDispatchService(
      repository as unknown as NotificationsRepository,
      emailProvider as unknown as EmailProvider
    );

    const result = await service.dispatchPending();
    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(emailProvider.send).not.toHaveBeenCalled();
  });
});
