import { Response } from 'express';

interface Meta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

/**
 * Every API response follows the standard envelope defined in the SRS
 * (Chapter 27 – API Design):
 *   { success, message, data, errors, meta }
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Request successful',
  statusCode = 200,
  meta: Meta = {}
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: [],
    meta,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors: unknown[] = [],
  code = 'ERROR'
) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: errors.length ? errors : [{ code, message }],
    meta: {},
  });
}
