import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createActiveUser, assignRole, deleteTestUser, closeTestPool } from '../../../test-utils/test-server';
import { query } from '../../../config/database';

describe('Meeting creation identity enforcement (integration)', () => {
  const password = 'MeetingTestPassw0rd!';
  let callerId: string;
  let impersonationTargetId: string;

  beforeAll(async () => {
    const suffix = Date.now();
    callerId = await createActiveUser({ email: `meeting-caller-${suffix}@example.com`, password });
    impersonationTargetId = await createActiveUser({
      email: `meeting-target-${suffix}@example.com`,
      password,
    });
    await assignRole(callerId, 'secretary', 'global');
  });

  afterAll(async () => {
    await deleteTestUser(callerId);
    await deleteTestUser(impersonationTargetId);
    await closeTestPool();
  });

  it('ignores a client-supplied called_by and always uses the authenticated caller', async () => {
    const emailRows = await query<{ email: string }[]>(`SELECT email FROM users WHERE id = :id`, {
      id: callerId,
    });
    const token = (
      await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: emailRows[0].email, password })
    ).body.data.accessToken as string;

    const res = await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Attempted impersonation test meeting',
        meeting_type: 'executive',
        scheduled_at: '2026-09-01 17:00:00',
        status: 'scheduled',
        // Attempting to spoof who called the meeting:
        called_by: impersonationTargetId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.called_by).toBe(callerId);
    expect(res.body.data.called_by).not.toBe(impersonationTargetId);

    await query(`DELETE FROM meetings WHERE id = :id`, { id: res.body.data.id });
  });
});
