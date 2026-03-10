import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const maxReferenceImages = 3;
const maxReferenceImageValueLength = 7_000_000;

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isDataImageUrl = (value: string) => /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value);

const referenceImageSchema = z
  .string()
  .max(maxReferenceImageValueLength, 'Reference image value is too long')
  .refine((value) => isHttpUrl(value) || isDataImageUrl(value), {
    message: 'Reference image must be a valid http/https URL or an image data URL',
  });

export const orderItemInputSchema = z.object({
  productTypeId: z.string().regex(objectIdRegex, 'Invalid product type ID'),
  flavorId: z.string().regex(objectIdRegex, 'Invalid flavor ID'),
  cakeShapeId: z.string().regex(objectIdRegex, 'Invalid cake shape ID').optional(),
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
  weight: z.number().positive('Weight must be greater than 0').optional(),
  specialInstructions: z.string().max(1000, 'Special instructions too long').optional().default(''),
  customDecorations: z.string().max(500, 'Custom decorations too long').optional().default(''),
  referenceImages: z
    .array(referenceImageSchema)
    .max(maxReferenceImages, `A maximum of ${maxReferenceImages} reference images is allowed per order item`)
    .optional()
    .default([]),
  customComplexityAdjustment: z.enum(['Low', 'Medium', 'High']).optional(),
}).refine((data) => Boolean(data.quantity) || Boolean(data.weight), {
  message: 'Either quantity or weight is required',
  path: ['quantity'],
});

export const deliveryAddressInputSchema = z.object({
  id: z.string().min(1, 'Address ID is required'),
  label: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().regex(objectIdRegex, 'Invalid customer ID'),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  deliveryAddressId: z.string().optional(),
  deliveryAddress: deliveryAddressInputSchema.optional(),
  orderDateTime: z.coerce.date(),
  items: z.array(orderItemInputSchema).min(1, 'At least one order item is required'),
  notes: z.string().max(2000, 'Notes too long').optional().default(''),
  paidAmount: z.number().min(0, 'Paid amount cannot be negative').optional().default(0),
}).refine((data) => {
  if (data.deliveryMethod === 'pickup') {
    return true;
  }

  return Boolean(data.deliveryAddressId);
}, {
  message: 'Delivery address is required when delivery method is delivery',
  path: ['deliveryAddressId'],
});

export const orderQuerySchema = z.object({
  customerId: z.string().regex(objectIdRegex, 'Invalid customer ID').optional(),
  status: z.enum(['pending', 'in-progress', 'ready', 'completed']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  productTypeId: z.string().regex(objectIdRegex, 'Invalid product type ID').optional(),
  search: z.string().max(100, 'Search text too long').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const estimateOrderProductionTimeSchema = z.object({
  items: z.array(
    z.object({
      productTypeId: z.string().regex(objectIdRegex, 'Invalid product type ID'),
      quantity: z.number().positive('Quantity must be greater than 0').optional(),
      weight: z.number().positive('Weight must be greater than 0').optional(),
    }).refine((data) => data.quantity !== undefined || data.weight !== undefined, {
      message: 'Either quantity or weight is required',
      path: ['quantity'],
    })
  ).min(1, 'At least one item is required for estimate'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type EstimateOrderProductionTimeInput = z.infer<typeof estimateOrderProductionTimeSchema>;
