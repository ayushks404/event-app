import { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authService } from './auth.service';

export const registerHandler: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.valid.body);
  res.status(201).json({ success: true, data: result });
});

export const loginHandler: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.login(req.valid.body);
  res.json({ success: true, data: result });
});

export const meHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user!.id);
  res.json({ success: true, data: { user } });
});

export const updateMeHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.user!.id, req.valid.body);
  res.json({ success: true, data: { user } });
});
