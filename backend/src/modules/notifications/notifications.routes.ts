import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
  unreadCountHandler,
} from './notifications.controller';
import { listNotificationsQuery, notificationIdParam } from './notifications.schema';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', validate({ query: listNotificationsQuery }), listNotificationsHandler);
notificationsRouter.get('/unread-count', unreadCountHandler);
notificationsRouter.put('/read-all', markAllReadHandler);
notificationsRouter.put('/:id/read', validate({ params: notificationIdParam }), markReadHandler);
