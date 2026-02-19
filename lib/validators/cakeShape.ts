import { z } from 'zod';

// Schema for creating a cake shape
export const createCakeShapeSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .default(''),

  isActive: z.boolean()
    .default(true),

  sortOrder: z.number()
    .int('Sort order must be a whole number')
    .default(0),
});

// Schema for updating a cake shape (same as create for now, can be extended)
export const updateCakeShapeSchema = createCakeShapeSchema;

// TypeScript type inferred from schema
export type CreateCakeShapeInput = z.infer<typeof createCakeShapeSchema>;
export type UpdateCakeShapeInput = z.infer<typeof updateCakeShapeSchema>;
