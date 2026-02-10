import { z } from 'zod';

// Schema for login
export const loginSchema = z.object({
  phone: z.string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .trim(),

  password: z.string()
    .min(1, 'Password is required')
    .trim(),
});

// TypeScript type inferred from schema
export type LoginInput = z.infer<typeof loginSchema>;
