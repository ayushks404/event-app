import { z } from 'zod';

export const addFavoriteSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

export const removeFavoriteParam = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});
