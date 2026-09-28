import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../types/dto';
import { AppError } from '../utils/AppError';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  try {
    const p = jwt.verify(h.slice(7), env.JWT_SECRET) as JwtPayload & { role: Role };
    req.user = { id: String(p.sub), role: p.role };
    next();
  } catch (e) {
    next(e instanceof jwt.TokenExpiredError
      ? new AppError(401, 'TOKEN_EXPIRED', 'Session expired, please log in again')
      : new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  }
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const p = jwt.verify(h.slice(7), env.JWT_SECRET) as JwtPayload & { role: Role };
    req.user = { id: String(p.sub), role: p.role };
  } catch {
    // optional auth ignores invalid/expired token
  }
  next();
};
