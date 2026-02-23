import { z } from 'zod';

export const customerPhoneQuerySchema = z.object({
  phone: z.string()
    .min(6, 'Phone number must be at least 6 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .trim(),
});

export type CustomerPhoneQuery = z.infer<typeof customerPhoneQuerySchema>;

export const addressInputSchema = z.object({
  label: z.string().max(100).optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  notes: z.string().optional(),
});

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email').trim(),
  phone: z.string()
    .min(6, 'Phone number must be at least 6 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .trim(),
  notes: z.string().optional().default(''),
  addresses: z.array(addressInputSchema).optional().default([]),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email').trim(),
  phone: z.string()
    .min(6, 'Phone number must be at least 6 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .trim(),
  notes: z.string().optional(),
  addresses: z.array(addressInputSchema).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
