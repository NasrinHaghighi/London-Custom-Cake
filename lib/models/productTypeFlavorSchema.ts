import { Schema, model, models } from "mongoose";

const ProductTypeFlavorSchema = new Schema(
  {
    productTypeId: {
      type: Schema.Types.ObjectId,
      ref: "ProductType",
      required: true,
    },
    flavorId: {
      type: Schema.Types.ObjectId,
      ref: "FlavorType",
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Indexes for performance
// 1. Unique compound index - prevent duplicate product-flavor combinations
ProductTypeFlavorSchema.index({ productTypeId: 1, flavorId: 1 }, { unique: true });

// 2. FlavorId index - fast query "which products use this flavor?"
ProductTypeFlavorSchema.index({ flavorId: 1 });

// 3. ProductTypeId index - fast query "which flavors for this product?"
ProductTypeFlavorSchema.index({ productTypeId: 1 });

// 4. Availability index - filter available/unavailable combinations
ProductTypeFlavorSchema.index({ isAvailable: 1 });

// 5. Compound index - get available flavors for specific product (common query)
ProductTypeFlavorSchema.index({ productTypeId: 1, isAvailable: 1 });

export default models.ProductTypeFlavor || model("ProductTypeFlavor", ProductTypeFlavorSchema);
