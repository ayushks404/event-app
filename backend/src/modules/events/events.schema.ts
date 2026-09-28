import { z } from 'zod';
import { CATEGORIES } from '../../constants/categories';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)), 'Invalid date');
const boolFlag = z.enum(['true', 'false']).transform(v => v === 'true');

export const listEventsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  location: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  available: boolFlag.optional(),
  featured: boolFlag.optional(),
  sort: z.enum(['date', 'price', 'popularity']).default('date'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
.refine(d => d.minPrice === undefined || d.maxPrice === undefined || d.minPrice <= d.maxPrice, { path: ['maxPrice'], message: 'Max price must be ≥ min price' })
.refine(d => !d.dateFrom || !d.dateTo || d.dateFrom <= d.dateTo, { path: ['dateTo'], message: 'End date must be on or after start date' });

export const eventIdParam = z.object({
  id: z.string().uuid('Invalid event ID'),
});
