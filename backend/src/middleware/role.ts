import { RequestHandler } from 'express';
import { Role } from '../types/dto';
import { AppError } from '../utils/AppError';

export const requireRole = (role: Role): RequestHandler => (req, _res, next) =>
  req.user?.role === role ? next() : next(new AppError(403, 'FORBIDDEN', 'You do not have access to this resource'));
