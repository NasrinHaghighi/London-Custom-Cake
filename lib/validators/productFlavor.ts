import { z } from 'zod';

// Schema for creating product-flavor combination
export const createProductFlavorSchema = z.object({
  productTypeId: z.string()
    .min(1, 'Product type is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product type ID'),

  flavorId: z.string()
    .min(1, 'Flavor is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid flavor ID'),

  isAvailable: z.boolean()
    .default(true),

  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .default(''),
});

// Schema for updating product-flavor combination
export const updateProductFlavorSchema = z.object({
  isAvailable: z.boolean()
    .optional(),

  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

// TypeScript types inferred from schemas
export type ProductFlavorInput = z.infer<typeof createProductFlavorSchema>;
export type ProductFlavorUpdate = z.infer<typeof updateProductFlavorSchema>;
