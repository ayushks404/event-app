import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getEventDetailHandler, listEventsHandler } from './events.controller';
import { eventIdParam, listEventsQuery } from './events.schema';

export const eventsRouter = Router();

eventsRouter.get('/', optionalAuth, validate({ query: listEventsQuery }), listEventsHandler);
eventsRouter.get('/:id', optionalAuth, validate({ params: eventIdParam }), getEventDetailHandler);
