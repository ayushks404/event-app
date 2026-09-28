import { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { organizerService } from './organizer.service';

export const dashboardHandler: RequestHandler = asyncHandler(async (req, res) => {
  const dashboard = await organizerService.getDashboard(req.user!.id);
  res.json({ success: true, data: dashboard });
});

export const ownEventsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const events = await organizerService.getOwnEvents(req.user!.id);
  res.json({ success: true, data: events });
});

export const attendeesHandler: RequestHandler = asyncHandler(async (req, res) => {
  const attendees = await organizerService.getAttendees(req.user!.id, req.valid.params.id, req.valid.query.q);
  res.json({ success: true, data: attendees });
});
