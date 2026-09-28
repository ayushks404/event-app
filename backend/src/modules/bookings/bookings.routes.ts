import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { cancelBookingHandler, createBookingHandler, getBookingDetailHandler, listBookingsHandler } from './bookings.controller';
import { bookingIdParam, createBookingSchema, listBookingsQuery } from './bookings.schema';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.post('/', validate({ body: createBookingSchema }), createBookingHandler);
bookingsRouter.get('/', validate({ query: listBookingsQuery }), listBookingsHandler);
bookingsRouter.get('/:id', validate({ params: bookingIdParam }), getBookingDetailHandler);
bookingsRouter.put('/:id/cancel', validate({ params: bookingIdParam }), cancelBookingHandler);
