import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { checkDatabaseConnection } from './config/database';
import { startNotificationDispatcher } from './modules/notifications/services/notification-dispatch.service';

async function bootstrap() {
  const app = createApp();

  const dbHealthy = await checkDatabaseConnection();
  if (!dbHealthy) {
    logger.warn('Starting without a confirmed database connection — check your .env DB settings.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`TECUMP API listening on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
  });

  const stopDispatcher = startNotificationDispatcher(env.NOTIFICATION_DISPATCH_INTERVAL_MS);
  logger.info(`Notification dispatcher running every ${env.NOTIFICATION_DISPATCH_INTERVAL_MS}ms`);

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    stopDispatcher();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});
