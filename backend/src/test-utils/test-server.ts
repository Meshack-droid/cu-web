/**
 * Shared helpers for integration tests: spins up the real Express app
 * in-process (no separate server needed — supertest talks to it directly)
 * against whatever database is configured in .env. These tests are only
 * meaningful with a real MySQL instance available; see vitest.integration.config.mts.
 */
import { createApp } from '../app';
import { pool, query } from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const app = createApp();

/** Creates a fully-activated test user directly in the DB, bypassing the approval workflow. */
export async function createActiveUser(overrides: {
  email: string;
  password: string;
  fullName?: string;
}) {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(overrides.password, 12);
  await query(
    `INSERT INTO users (id, username, email, password_hash, full_name, account_status, email_verified_at)
     VALUES (:id, :username, :email, :passwordHash, :fullName, 'active', NOW())`,
    {
      id,
      username: overrides.email.split('@')[0] + '_' + id.slice(0, 6),
      email: overrides.email,
      passwordHash,
      fullName: overrides.fullName ?? 'Integration Test User',
    }
  );
  return id;
}

export async function assignRole(
  userId: string,
  roleCode: string,
  scopeType: 'global' | 'ministry' | 'committee' = 'global',
  scopeId: string | null = null
) {
  const roleRows = await query<{ id: string }[]>(`SELECT id FROM roles WHERE code = :roleCode`, {
    roleCode,
  });
  if (!roleRows[0]) throw new Error(`Role "${roleCode}" not found — did you run the seed?`);
  await query(
    `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current)
     VALUES (UUID(), :userId, :roleId, :scopeType, :scopeId, CURDATE(), TRUE)`,
    { userId, roleId: roleRows[0].id, scopeType, scopeId }
  );
}

export async function getMinistryIdByCode(code: string) {
  const rows = await query<{ id: string }[]>(`SELECT id FROM ministries WHERE code = :code`, { code });
  return rows[0]?.id;
}

/** Deletes everything created by a test user (cascades via FK where possible), for cleanup in afterEach/afterAll. */
export async function deleteTestUser(userId: string) {
  await query(`DELETE FROM ministry_members WHERE user_id = :userId`, { userId });
  await query(`DELETE FROM user_roles WHERE user_id = :userId`, { userId });
  await query(`DELETE FROM membership_applications WHERE user_id = :userId`, { userId });
  await query(`DELETE FROM memberships WHERE user_id = :userId`, { userId });
  await query(`DELETE FROM refresh_tokens WHERE user_id = :userId`, { userId });
  await query(`DELETE FROM security_events WHERE user_id = :userId`, { userId });
  await query(`DELETE FROM users WHERE id = :userId`, { userId });
}

export async function closeTestPool() {
  await pool.end();
}
