import mongoose, { Schema, Document } from 'mongoose';

export interface IFlavorType extends Document {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const FlavorTypeSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance
// 1. Name index - Fast search and unique constraint (already unique, but explicit)
FlavorTypeSchema.index({ name: 1 });

// 2. Compound index - Fast sorted list (used in flavor list: sort by sortOrder then name)
FlavorTypeSchema.index({ sortOrder: 1, name: 1 });

// 3. Active status index - Fast filtering of active flavors only
FlavorTypeSchema.index({ isActive: 1 });

export default mongoose.models.FlavorType || mongoose.model<IFlavorType>('FlavorType', FlavorTypeSchema);
