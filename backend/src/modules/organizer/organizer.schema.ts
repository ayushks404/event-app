import { z } from 'zod';

export const eventIdParam = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export const attendeesQuery = z.object({
  q: z.string().trim().max(100).optional(),
});
