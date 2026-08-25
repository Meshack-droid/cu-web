/**
 * Simple, dependency-free migration runner.
 *
 * Applies every .sql file in src/database/migrations in filename order
 * (001_..., 002_..., ...) inside a single connection with multipleStatements
 * enabled, and records applied filenames in a `schema_migrations` table so
 * re-running is safe. Matches the migration order defined in Chapter 79.
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [appliedRows] = await connection.query('SELECT filename FROM schema_migrations');
  const applied = new Set((appliedRows as { filename: string }[]).map((r) => r.filename));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      logger.info(`⏭  Skipping already-applied migration: ${file}`);
      continue;
    }

    logger.info(`▶  Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await connection.query(sql);
    await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    logger.info(`✅ Applied: ${file}`);
  }

  await connection.end();
  logger.info('Migrations complete.');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
