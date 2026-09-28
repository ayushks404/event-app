import { z } from 'zod';
import { CATEGORIES } from '../constants/categories';
import { toDateString } from './format';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter').regex(/[0-9]/, 'Needs a number'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'organizer']).default('user'),
}).refine(d => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
});

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Select a time');

export const eventFormSchema = z.object({
  name: z.string().trim().min(3, 'At least 3 characters').max(120),
  description: z.string().trim().min(10, 'At least 10 characters').max(5000),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Select a category' }) }),
  image: z.string().trim().url('Enter a valid image URL').or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date'),
  startTime: timeStr,
  endTime: timeStr,
  venue: z.string().trim().min(2, 'Venue is required'),
  address: z.string().trim().min(5, 'Address is required'),
  ticketPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price (0 or more)'),
  totalSeats: z.string().regex(/^\d+$/, 'Enter a whole number')
    .refine(v => Number(v) >= 1 && Number(v) <= 100000, 'Between 1 and 100000'),
})
.refine(d => d.endTime > d.startTime, { path: ['endTime'], message: 'End time must be after start time' })
.superRefine((d, ctx) => {
  if (d.date < toDateString(new Date())) {
    ctx.addIssue({ code: 'custom', path: ['date'], message: 'Date must be today or later' });
  }
});
