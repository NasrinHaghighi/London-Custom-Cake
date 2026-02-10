import { Schema, model, models } from "mongoose";

const ProductTypeSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    // Pricing configuration
    pricingMethod: {
      type: String,
      enum: ['perunit', 'perkg'],
      required: true,
      default: 'perunit'
    },

    // For 'perunit' pricing
    unitPrice: { type: Number },
    minQuantity: { type: Number },
    maxQuantity: { type: Number },

    // For 'perkg' pricing
    pricePerKg: { type: Number },
    minWeight: { type: Number },
    maxWeight: { type: Number },
  },
  { timestamps: true }
);

// Indexes for performance
// 1. Name index - Fast search by product name
ProductTypeSchema.index({ name: 1 });

// 2. Compound index - Fast sorted list of active products (used in product list page)
// Sorts by: active first, then by sortOrder, then by name
ProductTypeSchema.index({ isActive: -1, sortOrder: 1, name: 1 });

// 3. CreatedAt index - Fast queries for recently added products
ProductTypeSchema.index({ createdAt: -1 });

export default models.ProductType || model("ProductType", ProductTypeSchema);
