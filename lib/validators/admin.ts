import { z } from 'zod';

// Phone validation regex - adjust based on your requirements
// This accepts UK phone formats: +44, 07, etc.
const phoneRegex = /^(?:(?:\+44\s?|0)7\d{3}\s?\d{6}|(?:\+44\s?|0)\d{10})$/;

// Schema for creating/inviting an admin
export const createAdminSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  phone: z.string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, +, -, and ()')
    .trim(),
});

// TypeScript type inferred from schema
export type AdminInput = z.infer<typeof createAdminSchema>;
