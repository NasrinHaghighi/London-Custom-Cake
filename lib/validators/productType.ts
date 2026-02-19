import { z } from 'zod';

// Schema for creating a product type
export const createProductTypeSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 50 characters')
    .trim(),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .default(''),

  isActive: z.boolean()
    .default(true),

  pricingMethod: z.enum(['perunit', 'perkg']),

  // Fields for 'perunit' pricing
  unitPrice: z.number()
    .positive('Unit price must be positive')
    .optional(),

  minQuantity: z.number()
    .int('Min quantity must be a whole number')
    .nonnegative('Min quantity cannot be negative')
    .optional(),

  maxQuantity: z.number()
    .int('Max quantity must be a whole number')
    .positive('Max quantity must be positive')
    .optional(),

  // Fields for 'perkg' pricing
  pricePerKg: z.number()
    .positive('Price per kg must be positive')
    .optional(),

  minWeight: z.number()
    .nonnegative('Min weight cannot be negative')
    .optional(),

  maxWeight: z.number()
    .positive('Max weight must be positive')
    .optional(),

  // Cake shapes (array of shape IDs)
  shapeIds: z.array(z.string()).default([]),
})
.refine(
  (data) => {
    // If pricing method is 'perunit', unitPrice is required
    if (data.pricingMethod === 'perunit' && !data.unitPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Unit price is required when pricing method is "perunit"',
    path: ['unitPrice'],
  }
)
.refine(
  (data) => {
    // If pricing method is 'perkg', pricePerKg is required
    if (data.pricingMethod === 'perkg' && !data.pricePerKg) {
      return false;
    }
    return true;
  },
  {
    message: 'Price per kg is required when pricing method is "perkg"',
    path: ['pricePerKg'],
  }
)
.refine(
  (data) => {
    // If maxQuantity is provided, it should be greater than minQuantity
    if (data.minQuantity && data.maxQuantity && data.maxQuantity <= data.minQuantity) {
      return false;
    }
    return true;
  },
  {
    message: 'Max quantity must be greater than min quantity',
    path: ['maxQuantity'],
  }
)
.refine(
  (data) => {
    // If maxWeight is provided, it should be greater than minWeight
    if (data.minWeight && data.maxWeight && data.maxWeight <= data.minWeight) {
      return false;
    }
    return true;
  },
  {
    message: 'Max weight must be greater than min weight',
    path: ['maxWeight'],
  }
);

// Schema for updating a product type (same as create)
export const updateProductTypeSchema = createProductTypeSchema;

// TypeScript type inferred from schema
export type ProductTypeInput = z.infer<typeof createProductTypeSchema>;
