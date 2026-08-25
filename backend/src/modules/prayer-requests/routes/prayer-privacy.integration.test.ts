import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createActiveUser, assignRole, deleteTestUser, closeTestPool } from '../../../test-utils/test-server';
import { query } from '../../../config/database';

describe('Prayer request privacy (integration)', () => {
  const password = 'PrayerTestPassw0rd!';
  let requesterId: string;
  let ordinaryMemberId: string;
  let prayerChairId: string;
  let privateRequestId: string;

  beforeAll(async () => {
    const suffix = Date.now();
    requesterId = await createActiveUser({ email: `prayer-requester-${suffix}@example.com`, password });
    ordinaryMemberId = await createActiveUser({ email: `prayer-bystander-${suffix}@example.com`, password });
    prayerChairId = await createActiveUser({ email: `prayer-chair-${suffix}@example.com`, password });

    await assignRole(requesterId, 'member', 'global');
    await assignRole(ordinaryMemberId, 'member', 'global');
    await assignRole(prayerChairId, 'prayer_chairperson', 'global');
  });

  afterAll(async () => {
    await query(`DELETE FROM prayer_requests WHERE id = :id`, { id: privateRequestId });
    await deleteTestUser(requesterId);
    await deleteTestUser(ordinaryMemberId);
    await deleteTestUser(prayerChairId);
    await closeTestPool();
  });

  async function loginAs(userId: string) {
    const rows = await query<{ email: string }[]>(`SELECT email FROM users WHERE id = :id`, { id: userId });
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: rows[0].email, password });
    return res.body.data.accessToken as string;
  }

  it('creates a private prayer request as the requester', async () => {
    const token = await loginAs(requesterId);
    const res = await request(app)
      .post('/api/v1/prayer-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Private family matter', details: 'Please pray for my family.', privacyLevel: 'private' });

    expect(res.status).toBe(201);
    privateRequestId = res.body.data.id;
  });

  it('lets the requester see their own private request in the list', async () => {
    const token = await loginAs(requesterId);
    const res = await request(app).get('/api/v1/prayer-requests').set('Authorization', `Bearer ${token}`);
    const ids = res.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(privateRequestId);
  });

  it('hides the private request from an unrelated ordinary member', async () => {
    const token = await loginAs(ordinaryMemberId);
    const listRes = await request(app).get('/api/v1/prayer-requests').set('Authorization', `Bearer ${token}`);
    const ids = listRes.body.data.map((r: { id: string }) => r.id);
    expect(ids).not.toContain(privateRequestId);

    // Direct lookup by ID must also be hidden — a 404, not a 403, so the
    // response doesn't even confirm the request exists.
    const directRes = await request(app)
      .get(`/api/v1/prayer-requests/${privateRequestId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(directRes.status).toBe(404);
  });

  it('shows the private request to the Prayer Chairperson (view_confidential)', async () => {
    const token = await loginAs(prayerChairId);
    const res = await request(app).get('/api/v1/prayer-requests').set('Authorization', `Bearer ${token}`);
    const ids = res.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(privateRequestId);
  });

  it('stores anonymous requests with no traceable author', async () => {
    const token = await loginAs(ordinaryMemberId);
    const res = await request(app)
      .post('/api/v1/prayer-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Anonymous struggle', details: 'Please pray for me.', anonymous: true });

    expect(res.status).toBe(201);
    expect(res.body.data.requested_by).toBeNull();

    await query(`DELETE FROM prayer_requests WHERE id = :id`, { id: res.body.data.id });
  });
});
