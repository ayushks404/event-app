import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter').regex(/[0-9]/, 'Needs a number'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'organizer']).default('user'),
}).refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
}).refine(d => d.name !== undefined || d.mobile !== undefined, { message: 'Nothing to update' });
