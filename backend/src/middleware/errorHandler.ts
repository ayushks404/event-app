import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, code: string, message: string, details?: unknown) =>
    res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });

  if (err instanceof AppError) return send(err.status, err.code, err.message, err.details);
  if (err instanceof ZodError) return send(400, 'VALIDATION_ERROR', 'Please check the highlighted fields', err.flatten().fieldErrors);
  if (err?.type === 'entity.parse.failed') return send(400, 'VALIDATION_ERROR', 'Invalid JSON body');
  if (err?.code === '23505') {
    if (err.constraint === 'users_email_uq') return send(409, 'EMAIL_TAKEN', 'This email is already registered', { email: ['Email already registered'] });
    return send(409, 'CONFLICT', 'Conflict with existing data');
  }
  logger.error(err);
  return send(500, 'INTERNAL_ERROR', 'Something went wrong');
};
