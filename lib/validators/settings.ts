import { z } from 'zod';

export const updateComplexityThresholdSettingsSchema = z.object({
  lowMaxMinutes: z.coerce
    .number()
    .int('Low threshold must be a whole number')
    .min(1, 'Low threshold must be at least 1 minute')
    .max(24 * 60, 'Low threshold must be 24 hours or less'),
  mediumMaxMinutes: z.coerce
    .number()
    .int('Medium threshold must be a whole number')
    .min(2, 'Medium threshold must be at least 2 minutes')
    .max(48 * 60, 'Medium threshold must be 48 hours or less'),
}).refine((data) => data.mediumMaxMinutes > data.lowMaxMinutes, {
  message: 'Medium threshold must be greater than low threshold',
  path: ['mediumMaxMinutes'],
});

export type UpdateComplexityThresholdSettingsInput = z.infer<typeof updateComplexityThresholdSettingsSchema>;
