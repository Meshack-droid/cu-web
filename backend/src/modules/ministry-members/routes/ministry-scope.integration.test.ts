import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { query } from '../../../config/database';
import request from 'supertest';
import {
  app,
  createActiveUser,
  assignRole,
  getMinistryIdByCode,
  deleteTestUser,
  closeTestPool,
} from '../../../test-utils/test-server';

describe('Ministry scope enforcement (integration)', () => {
  const password = 'ScopeTestPassw0rd!';
  let mediaLeaderId: string;
  let ushLeaderId: string;
  let secretaryId: string;
  let targetUserId: string;
  let mediaMinistryId: string;
  let usheringMinistryId: string;
  let createdRosterId: string | undefined;

  beforeAll(async () => {
    const suffix = Date.now();
    mediaLeaderId = await createActiveUser({ email: `media-leader-${suffix}@example.com`, password });
    ushLeaderId = await createActiveUser({ email: `ushering-leader-${suffix}@example.com`, password });
    secretaryId = await createActiveUser({ email: `test-secretary-${suffix}@example.com`, password });
    targetUserId = await createActiveUser({ email: `roster-target-${suffix}@example.com`, password });

    mediaMinistryId = (await getMinistryIdByCode('media'))!;
    usheringMinistryId = (await getMinistryIdByCode('ushering'))!;

    await assignRole(mediaLeaderId, 'ministry_leader', 'ministry', mediaMinistryId);
    await assignRole(ushLeaderId, 'ministry_leader', 'ministry', usheringMinistryId);
    await assignRole(secretaryId, 'secretary', 'global');
  });

  afterAll(async () => {
    await deleteTestUser(mediaLeaderId);
    await deleteTestUser(ushLeaderId);
    await deleteTestUser(secretaryId);
    await deleteTestUser(targetUserId);
    await closeTestPool();
  });

  async function loginAs(email: string) {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: email, password });
    return res.body.data.accessToken as string;
  }

  it('lets a Ministry Leader manage their own ministry roster', async () => {
    const token = await loginAs((await getEmailFor(mediaLeaderId)) as string);
    const res = await request(app)
      .post('/api/v1/ministry-members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ministry_id: mediaMinistryId,
        user_id: targetUserId,
        position: 'member',
        spiritual_year_id: await getCurrentSpiritualYearId(),
        start_date: '2026-08-06',
      });

    expect(res.status).toBe(201);
    createdRosterId = res.body.data.id;
  });

  it('blocks that same leader from touching a DIFFERENT ministry', async () => {
    const token = await loginAs((await getEmailFor(mediaLeaderId)) as string);
    const res = await request(app)
      .post('/api/v1/ministry-members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ministry_id: usheringMinistryId,
        user_id: targetUserId,
        position: 'member',
        spiritual_year_id: await getCurrentSpiritualYearId(),
        start_date: '2026-08-06',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only manage the ministry you are assigned to lead/);
  });

  it('lets the Secretary (manage_all_members bypass) touch any ministry', async () => {
    const token = await loginAs((await getEmailFor(secretaryId)) as string);
    const res = await request(app)
      .post('/api/v1/ministry-members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ministry_id: usheringMinistryId,
        user_id: targetUserId,
        position: 'member',
        spiritual_year_id: await getCurrentSpiritualYearId(),
        start_date: '2026-08-06',
      });

    expect(res.status).toBe(201);
  });
});

// --- small local helpers, kept in this file since they're only meaningful here ---

async function getEmailFor(userId: string) {
  const rows = await query<{ email: string }[]>(`SELECT email FROM users WHERE id = :userId`, { userId });
  return rows[0]?.email;
}

async function getCurrentSpiritualYearId() {
  const rows = await query<{ id: string }[]>(`SELECT id FROM spiritual_years WHERE is_current = TRUE LIMIT 1`);
  return rows[0]?.id;
}
