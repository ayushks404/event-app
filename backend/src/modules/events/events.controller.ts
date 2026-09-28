import { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { eventsService } from './events.service';

export const listEventsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.id ?? null;
  const { items, meta } = await eventsService.list(userId, req.valid.query);
  res.json({ success: true, data: items, meta });
});

export const getEventDetailHandler: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.id ?? null;
  const detail = await eventsService.detail(req.valid.params.id, userId);
  res.json({ success: true, data: detail });
});

export const createEventHandler: RequestHandler = asyncHandler(async (req, res) => {
  const detail = await eventsService.create(req.user!.id, req.valid.body);
  res.status(201).json({ success: true, data: detail });
});

export const updateEventHandler: RequestHandler = asyncHandler(async (req, res) => {
  const detail = await eventsService.update(req.user!.id, req.valid.params.id, req.valid.body);
  res.json({ success: true, data: detail });
});

export const deleteEventHandler: RequestHandler = asyncHandler(async (req, res) => {
  const result = await eventsService.delete(req.user!.id, req.valid.params.id);
  res.json({ success: true, data: result });
});
