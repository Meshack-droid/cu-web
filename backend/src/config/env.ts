import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api/v1'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('tecump'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('tecump'),
  DB_CONNECTION_LIMIT: z.coerce.number().default(10),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().default('tumcu-tecump-jwt-access-secret-32-chars-long-secure-key'),
  JWT_REFRESH_SECRET: z.string().default('tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173,*'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),

  // All optional: if SMTP_HOST is unset, the notification dispatcher logs
  // emails to the console instead of sending them — safe default for local
  // development, but every queued notification still gets processed and
  // marked sent so nothing silently piles up unsent.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('TUMCU Christian Union <no-reply@tumcu.ac.ke>'),
  NOTIFICATION_DISPATCH_INTERVAL_MS: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast: an invalid/missing configuration must never reach runtime.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
