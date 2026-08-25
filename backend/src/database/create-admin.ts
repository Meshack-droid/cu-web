/**
 * Bootstraps a Super Administrator account.
 *
 * Deliberately NOT part of seed.ts and NOT run automatically: baking a
 * default admin account (even a randomly-generated one) into seed data is
 * how "admin/admin" breaches happen — anyone with the repo would know an
 * admin account exists and could guess at it. This script requires a human
 * to explicitly run it and provide (or generate) real credentials.
 *
 * Usage:
 *   npm run create:admin -- --email admin@tumcu.ac.ke --name "Site Administrator"
 *   npm run create:admin -- --email admin@tumcu.ac.ke --name "Site Administrator" --password "..."
 *
 * If --password is omitted, a strong random password is generated and
 * printed ONCE — it is not stored anywhere in recoverable form. Change it
 * immediately after first login.
 *
 * Safe to re-run: if the email already exists, the script promotes that
 * existing account to Super Admin instead of creating a duplicate.
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

interface ParsedArgs {
  email?: string;
  name?: string;
  password?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--email') args.email = argv[++i];
    else if (argv[i] === '--name') args.name = argv[++i];
    else if (argv[i] === '--password') args.password = argv[++i];
  }
  return args;
}

function generateStrongPassword(): string {
  // 20 random bytes -> base64url, then guarantee at least one of each
  // required character class so it always passes the app's own password
  // policy (upper/lower/number/symbol, 10+ chars).
  const random = crypto.randomBytes(20).toString('base64url');
  return `${random}A9!`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email) {
    logger.error(
      'Usage: npm run create:admin -- --email you@example.com --name "Full Name" [--password "..."]'
    );
    process.exit(1);
  }

  const email = args.email.trim().toLowerCase();
  const fullName = args.name?.trim() || 'Super Administrator';

  if (args.password && args.password.length < 10) {
    logger.error('Password must be at least 10 characters.');
    process.exit(1);
  }

  const [superAdminRoleRows] = await pool.query(`SELECT id FROM roles WHERE code = 'super_admin'`);
  const superAdminRole = (superAdminRoleRows as { id: string }[])[0];
  if (!superAdminRole) {
    logger.error('super_admin role not found — run `npm run seed` first.');
    process.exit(1);
  }

  const [existingRows] = await pool.query(`SELECT id, email FROM users WHERE email = :email`, { email });
  const existing = (existingRows as { id: string; email: string }[])[0];

  // Only generate/print a password when one will actually be written:
  // a brand-new account always needs one; an existing account only gets
  // its password touched if --password was explicitly given. Otherwise
  // re-running the script to fix roles/status must never imply the
  // password changed — printing an unused generated password here would
  // make someone think that's their real password when it isn't.
  const willSetPassword = !existing || Boolean(args.password);
  const password = willSetPassword ? args.password || generateStrongPassword() : null;
  const passwordWasGenerated = willSetPassword && !args.password;

  let userId: string;

  if (existing) {
    userId = existing.id;
    await pool.query(
      `UPDATE users
          SET account_status = 'active',
              email_verified_at = COALESCE(email_verified_at, NOW()),
              failed_login_attempts = 0,
              locked_until = NULL
        WHERE id = :id`,
      { id: userId }
    );
    logger.info(`Existing account found for ${email} — promoting to Super Administrator.`);

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await pool.query(`UPDATE users SET password_hash = :passwordHash WHERE id = :id`, {
        passwordHash,
        id: userId,
      });
      logger.info('Password updated to the value provided via --password.');
    } else {
      logger.info('No --password given — existing password left unchanged.');
    }
  } else {
    const passwordHash = await bcrypt.hash(password as string, 12);
    await pool.query(
      `INSERT INTO users
         (id, username, email, password_hash, full_name, account_status, email_verified_at)
       VALUES
         (UUID(), :username, :email, :passwordHash, :fullName, 'active', NOW())`,
      { username: email.split('@')[0] + '_admin', email, passwordHash, fullName }
    );
    // MySQL doesn't return the generated UUID() value from the insert result,
    // so look the row back up by the unique email we just inserted.
    const [rows] = await pool.query(`SELECT id FROM users WHERE email = :email`, { email });
    userId = (rows as { id: string }[])[0].id;
    logger.info(`Created new account for ${email}.`);
  }

  await pool.query(
    `INSERT INTO user_roles (id, user_id, role_id, scope_type, start_date, is_current)
     SELECT UUID(), :userId, :roleId, 'global', CURDATE(), TRUE
      WHERE NOT EXISTS (
        SELECT 1 FROM user_roles
         WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE
      )`,
    { userId, roleId: superAdminRole.id }
  );

  logger.info('✅ Super Administrator account is ready.');
  logger.info(`   Email:    ${email}`);
  logger.info(`   Login at: /login`);

  if (passwordWasGenerated) {
    logger.warn('─'.repeat(60));
    logger.warn(`   Generated password (shown once): ${password}`);
    logger.warn('   Store this securely and change it after first login.');
    logger.warn('─'.repeat(60));
  }

  await pool.end();
}

run().catch((err) => {
  logger.error({ err }, 'Failed to create super admin');
  process.exit(1);
});
