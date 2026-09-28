import { z } from 'zod';
import { CATEGORIES } from '../../constants/categories';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)), 'Invalid date');
const boolFlag = z.enum(['true', 'false']).transform(v => v === 'true');
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');

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

const baseEventSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(CATEGORIES),
  image: z.string().trim().url().max(500).nullish().or(z.literal('')),
  date: isoDate,
  startTime: timeStr,
  endTime: timeStr,
  venue: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(250),
  ticketPrice: z.coerce.number().min(0).max(1_000_000),
  totalSeats: z.coerce.number().int().min(1).max(100_000),
});

export const createEventSchema = baseEventSchema.refine(d => d.endTime > d.startTime, {
  path: ['endTime'],
  message: 'End time must be after start time',
});

export const updateEventSchema = baseEventSchema.partial().refine(d => Object.keys(d).length > 0, {
  message: 'Nothing to update',
});
