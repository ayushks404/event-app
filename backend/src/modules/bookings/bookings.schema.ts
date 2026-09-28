import { z } from 'zod';
import { MAX_QTY } from '../../constants/pricing';

export const createBookingSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  ticketType: z.enum(['General', 'VIP']),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY),
});

export const bookingIdParam = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

export const listBookingsQuery = z.object({
  tab: z.enum(['upcoming', 'completed', 'cancelled']).default('upcoming'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
