import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import {
  createEventHandler,
  deleteEventHandler,
  getEventDetailHandler,
  listEventsHandler,
  updateEventHandler,
} from './events.controller';
import { createEventSchema, eventIdParam, listEventsQuery, updateEventSchema } from './events.schema';

export const eventsRouter = Router();

eventsRouter.get('/', optionalAuth, validate({ query: listEventsQuery }), listEventsHandler);
eventsRouter.get('/:id', optionalAuth, validate({ params: eventIdParam }), getEventDetailHandler);

eventsRouter.post('/', requireAuth, requireRole('organizer'), validate({ body: createEventSchema }), createEventHandler);
eventsRouter.put('/:id', requireAuth, requireRole('organizer'), validate({ params: eventIdParam, body: updateEventSchema }), updateEventHandler);
eventsRouter.delete('/:id', requireAuth, requireRole('organizer'), validate({ params: eventIdParam }), deleteEventHandler);
