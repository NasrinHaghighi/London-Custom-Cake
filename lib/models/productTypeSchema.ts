import { Schema, model, models } from "mongoose";

type MeasurementType = 'weight' | 'quantity';

type ProductionTimeConfig = {
  measurement_type?: MeasurementType;
  base_weight?: number;
  base_quantity?: number;
  bake_time_minutes?: number;
  fill_time_minutes?: number;
  decoration_time_minutes?: number;
  rest_time_minutes?: number;
  scale_bake?: boolean;
  scale_fill?: boolean;
  scale_decoration?: boolean;
  scale_rest?: boolean;
};

type ProductionTimeInput = {
  order_weight?: number;
  order_quantity?: number;
};

const getStageMinutes = (baseMinutes: number, shouldScale: boolean, factor: number) => {
  if (baseMinutes <= 0) {
    return 0;
  }

  return baseMinutes * (shouldScale ? factor : 1);
};

export function calculateProductionTime(config: ProductionTimeConfig, input: ProductionTimeInput = {}) {
  const measurementType = config.measurement_type || 'quantity';

  let factor = 1;
  if (measurementType === 'weight') {
    const baseWeight = config.base_weight || 0;
    const orderWeight = input.order_weight || 0;
    if (baseWeight > 0 && orderWeight > 0) {
      factor = orderWeight / baseWeight;
    }
  } else {
    const baseQuantity = config.base_quantity || 0;
    const orderQuantity = input.order_quantity || 0;
    if (baseQuantity > 0 && orderQuantity > 0) {
      factor = orderQuantity / baseQuantity;
    }
  }

  const bake = getStageMinutes(config.bake_time_minutes || 0, config.scale_bake ?? true, factor);
  const fill = getStageMinutes(config.fill_time_minutes || 0, config.scale_fill ?? true, factor);
  const decoration = getStageMinutes(config.decoration_time_minutes || 0, config.scale_decoration ?? true, factor);
  const rest = getStageMinutes(config.rest_time_minutes || 0, config.scale_rest ?? false, factor);

  return Math.ceil(bake + fill + decoration + rest);
}

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
    oversizeQuantityExtraMinutesPerUnit: {
      type: Number,
      min: 0,
      default: 30,
    },

    // For 'perkg' pricing
    pricePerKg: { type: Number },
    minWeight: { type: Number },
    maxWeight: { type: Number },
    oversizeWeightExtraMinutes: {
      type: Number,
      min: 0,
      default: 60,
    },

    // Cake shapes (one-to-many: a product can have multiple shapes)
    shapeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CakeShape',
      },
    ],

    // Estimated base preparation complexity for the product
    basePrepTime: {
      type: String,
      enum: ['Low', 'Medium', 'Hard'],
      required: true,
      default: 'Medium',
    },

    // Production-time configuration
    measurement_type: {
      type: String,
      enum: ['weight', 'quantity'],
      required: true,
      default: 'quantity',
    },
    base_weight: {
      type: Number,
      min: 0,
      required: function requiredBaseWeight(this: { measurement_type: MeasurementType }) {
        return this.measurement_type === 'weight';
      },
    },
    base_quantity: {
      type: Number,
      min: 1,
      required: function requiredBaseQuantity(this: { measurement_type: MeasurementType }) {
        return this.measurement_type === 'quantity';
      },
    },
    bake_time_minutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    fill_time_minutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    decoration_time_minutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    rest_time_minutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    scale_bake: {
      type: Boolean,
      default: true,
    },
    scale_fill: {
      type: Boolean,
      default: true,
    },
    scale_decoration: {
      type: Boolean,
      default: true,
    },
    scale_rest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ProductTypeSchema.methods.calculate_production_time = function calculateProductionTimeMethod(order_weight?: number, order_quantity?: number) {
  return calculateProductionTime(this, { order_weight, order_quantity });
};

// Indexes for performance
// 1. Name index - Fast search by product name
ProductTypeSchema.index({ name: 1 });

// 2. Compound index - Fast sorted list of active products (used in product list page)
// Sorts by: active first, then by sortOrder, then by name
ProductTypeSchema.index({ isActive: -1, sortOrder: 1, name: 1 });

// 3. CreatedAt index - Fast queries for recently added products
ProductTypeSchema.index({ createdAt: -1 });

// 4. ShapeIds index - Fast queries for products with specific shapes
ProductTypeSchema.index({ shapeIds: 1 });

if (process.env.NODE_ENV !== 'production' && models.ProductType) {
  delete models.ProductType;
}

export default models.ProductType || model("ProductType", ProductTypeSchema);
