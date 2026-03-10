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

  // Prep time complexity enum
  basePrepTime: z.enum(['Low', 'Medium', 'High']).default('Medium'),

  // Production-time configuration
  measurement_type: z.enum(['weight', 'quantity']).default('quantity'),
  base_weight: z.number()
    .positive('Base weight must be greater than 0')
    .optional(),
  base_quantity: z.number()
    .int('Base quantity must be a whole number')
    .positive('Base quantity must be greater than 0')
    .optional(),
  bake_time_minutes: z.number()
    .int('Bake time must be a whole number')
    .nonnegative('Bake time cannot be negative')
    .default(0),
  fill_time_minutes: z.number()
    .int('Fill time must be a whole number')
    .nonnegative('Fill time cannot be negative')
    .default(0),
  decoration_time_minutes: z.number()
    .int('Decoration time must be a whole number')
    .nonnegative('Decoration time cannot be negative')
    .default(0),
  rest_time_minutes: z.number()
    .int('Rest time must be a whole number')
    .nonnegative('Rest time cannot be negative')
    .default(0),
  scale_bake: z.boolean().default(true),
  scale_fill: z.boolean().default(true),
  scale_decoration: z.boolean().default(true),
  scale_rest: z.boolean().default(false),
})
.refine(
  (data) => {
    // If pricing method is 'perunit', unitPrice is required
    if (data.pricingMethod === 'perunit' && data.unitPrice == null) {
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
    if (data.pricingMethod === 'perkg' && data.pricePerKg == null) {
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
    if (data.minQuantity !== undefined && data.maxQuantity !== undefined && data.maxQuantity <= data.minQuantity) {
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
    if (data.minWeight !== undefined && data.maxWeight !== undefined && data.maxWeight <= data.minWeight) {
      return false;
    }
    return true;
  },
  {
    message: 'Max weight must be greater than min weight',
    path: ['maxWeight'],
  }
)
.refine(
  (data) => {
    const expectedMeasurementType = data.pricingMethod === 'perkg' ? 'weight' : 'quantity';
    return data.measurement_type === expectedMeasurementType;
  },
  {
    message: 'Measurement type must match pricing method (perunit -> quantity, perkg -> weight)',
    path: ['measurement_type'],
  }
)
.refine(
  (data) => {
    if (data.measurement_type === 'weight') {
      return data.base_weight !== undefined;
    }

    return true;
  },
  {
    message: 'Base weight is required when measurement type is "weight"',
    path: ['base_weight'],
  }
)
.refine(
  (data) => {
    if (data.measurement_type === 'quantity') {
      return data.base_quantity !== undefined;
    }

    return true;
  },
  {
    message: 'Base quantity is required when measurement type is "quantity"',
    path: ['base_quantity'],
  }
)
.refine(
  (data) => {
    if (data.measurement_type !== 'quantity') {
      return true;
    }

    if (data.base_quantity === undefined || data.minQuantity === undefined) {
      return true;
    }

    return data.base_quantity === data.minQuantity;
  },
  {
    message: 'Base quantity must match min quantity when measurement type is "quantity"',
    path: ['base_quantity'],
  }
);

// Schema for updating a product type (same as create)
export const updateProductTypeSchema = createProductTypeSchema;

// TypeScript type inferred from schema
export type ProductTypeInput = z.infer<typeof createProductTypeSchema>;
