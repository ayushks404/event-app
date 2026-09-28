import { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { notificationsService } from './notifications.service';

export const listNotificationsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { page, limit } = req.valid.query;
  const { items, meta } = await notificationsService.list(req.user!.id, page, limit);
  res.json({ success: true, data: items, meta });
});

export const unreadCountHandler: RequestHandler = asyncHandler(async (req, res) => {
  const count = await notificationsService.unreadCount(req.user!.id);
  res.json({ success: true, data: { count } });
});

export const markAllReadHandler: RequestHandler = asyncHandler(async (req, res) => {
  const updated = await notificationsService.markAllRead(req.user!.id);
  res.json({ success: true, data: { updated } });
});

export const markReadHandler: RequestHandler = asyncHandler(async (req, res) => {
  const notification = await notificationsService.markRead(req.valid.params.id, req.user!.id);
  res.json({ success: true, data: { notification } });
});
