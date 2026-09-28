import { Router } from 'express';
import { pool } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { authRouter } from '../modules/auth/auth.routes';
import { eventsRouter } from '../modules/events/events.routes';
import { bookingsRouter } from '../modules/bookings/bookings.routes';
import { favoritesRouter } from '../modules/favorites/favorites.routes';
import { notificationsRouter } from '../modules/notifications/notifications.routes';
import { organizerRouter } from '../modules/organizer/organizer.routes';

export const apiRouter = Router();

apiRouter.get('/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', time: new Date().toISOString() });
}));

apiRouter.use('/auth', authRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/favorites', favoritesRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/organizer', organizerRouter);
