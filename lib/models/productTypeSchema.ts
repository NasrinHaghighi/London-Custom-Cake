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

export default models.ProductType || model("ProductType", ProductTypeSchema);
