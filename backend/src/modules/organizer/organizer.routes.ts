import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import { attendeesHandler, dashboardHandler, ownEventsHandler } from './organizer.controller';
import { attendeesQuery, eventIdParam } from './organizer.schema';

export const organizerRouter = Router();

organizerRouter.use(requireAuth, requireRole('organizer'));

organizerRouter.get('/dashboard', dashboardHandler);
organizerRouter.get('/events', ownEventsHandler);
organizerRouter.get('/events/:id/attendees', validate({ params: eventIdParam, query: attendeesQuery }), attendeesHandler);
