import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'mbway']);
export const paymentTypeSchema = z.enum(['payment', 'refund']);
const proofImageDataUrlSchema = z.string()
  .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/i, 'Invalid proof image format')
  .max(4_000_000, 'Proof image is too large');

export const createPaymentSchema = z.object({
  orderId: z.string().regex(objectIdRegex, 'Invalid order ID'),
  type: paymentTypeSchema.default('payment'),
  method: paymentMethodSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  reference: z.string().max(150, 'Reference too long').optional(),
  note: z.string().max(1000, 'Note too long').optional(),
  proofImageDataUrl: proofImageDataUrlSchema.optional(),
  receivedAt: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  if (data.method === 'bank_transfer' && !data.reference?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reference'],
      message: 'Reference is required for bank transfer',
    });
  }

  const requiresProof = data.type === 'payment' && (data.method === 'bank_transfer' || data.method === 'mbway');
  if (requiresProof && !data.proofImageDataUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['proofImageDataUrl'],
      message: 'Proof image is required for bank transfer or MBWay payment',
    });
  }
});

export const updatePaymentSchema = z.object({
  type: paymentTypeSchema.optional(),
  method: paymentMethodSchema.optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  reference: z.string().max(150, 'Reference too long').optional(),
  note: z.string().max(1000, 'Note too long').optional(),
  proofImageDataUrl: proofImageDataUrlSchema.optional(),
  receivedAt: z.coerce.date().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required for update',
});

export const paymentQuerySchema = z.object({
  orderId: z.string().regex(objectIdRegex, 'Invalid order ID').optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
