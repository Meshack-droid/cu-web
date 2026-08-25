import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      data: null,
      errors: [{ code: 'ROUTE_NOT_FOUND', message: 'The requested endpoint does not exist' }],
      meta: {},
    });
  }
  next();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  if (err instanceof AppError) {
    logger.warn({ err, requestId, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      errors:
        err instanceof ValidationError && Array.isArray(err.details)
          ? err.details
          : [{ code: err.code, message: err.message }],
      meta: { requestId, timestamp: new Date().toISOString() },
    });
  }

  // Unknown/unexpected errors: never leak stack traces in production.
  logger.error({ err, requestId, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    data: null,
    errors: [{ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' }],
    meta: { requestId, timestamp: new Date().toISOString() },
  });
}
