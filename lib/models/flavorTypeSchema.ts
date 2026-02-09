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

export default mongoose.models.FlavorType || mongoose.model<IFlavorType>('FlavorType', FlavorTypeSchema);
