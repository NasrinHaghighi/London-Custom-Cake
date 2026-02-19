import { Schema, model, models } from "mongoose";

const CakeShapeSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
// 1. Name index - Fast search by shape name
CakeShapeSchema.index({ name: 1 });

// 2. Compound index - Fast sorted list of active shapes
CakeShapeSchema.index({ isActive: -1, sortOrder: 1, name: 1 });

// 3. CreatedAt index - Fast queries for recently added shapes
CakeShapeSchema.index({ createdAt: -1 });

export default models.CakeShape || model("CakeShape", CakeShapeSchema);
