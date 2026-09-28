import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { loginHandler, meHandler, registerHandler, updateMeHandler } from './auth.controller';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate({ body: registerSchema }), registerHandler);
authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.put('/me', requireAuth, validate({ body: updateProfileSchema }), updateMeHandler);
