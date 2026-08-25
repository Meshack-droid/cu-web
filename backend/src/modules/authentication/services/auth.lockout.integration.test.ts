import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../../test-utils/test-server';
import { createActiveUser, deleteTestUser, closeTestPool } from '../../../test-utils/test-server';

describe('Account lockout (integration)', () => {
  const email = `lockout-test-${Date.now()}@example.com`;
  const password = 'CorrectPassw0rd!';
  let userId: string;

  beforeAll(async () => {
    userId = await createActiveUser({ email, password });
  });

  afterAll(async () => {
    await deleteTestUser(userId);
    await closeTestPool();
  });

  it('allows login with correct credentials before any failures', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: email, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('locks the account after 5 consecutive failed attempts, exactly on the 5th', async () => {
    // Reset any state from the previous test by logging in correctly once more
    // isn't necessary — failed_login_attempts only increments on failure.
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: email, password: 'wrong-password' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    }

    // The 5th failed attempt is the one that should trigger the lock —
    // this is the exact off-by-one bug caught during manual testing
    // earlier (MySQL's left-to-right SET evaluation double-counted and
    // locked after only 4 attempts). This test pins that regression.
    const fifthAttempt = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password: 'wrong-password' });
    expect(fifthAttempt.status).toBe(401);
    expect(fifthAttempt.body.message).toMatch(/locked/i);
  });

  it('rejects even the CORRECT password while locked', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: email, password });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/locked/i);
  });
});
