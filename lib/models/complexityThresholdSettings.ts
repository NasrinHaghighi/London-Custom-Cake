import { Schema, model, models } from 'mongoose';

const ComplexityThresholdSettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    lowMaxMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 120,
    },
    mediumMaxMinutes: {
      type: Number,
      required: true,
      min: 2,
      default: 300,
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && models.ComplexityThresholdSettings) {
  delete models.ComplexityThresholdSettings;
}

export default models.ComplexityThresholdSettings || model('ComplexityThresholdSettings', ComplexityThresholdSettingsSchema);
