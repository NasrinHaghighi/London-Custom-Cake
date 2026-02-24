import { Schema, model, models } from 'mongoose';

const DeliveryAddressSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    productTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductType',
      required: true,
      index: true,
    },
    productTypeName: { type: String, required: true },
    flavorId: {
      type: Schema.Types.ObjectId,
      ref: 'FlavorType',
      required: true,
      index: true,
    },
    flavorName: { type: String, required: true },
    cakeShapeId: {
      type: Schema.Types.ObjectId,
      ref: 'CakeShape',
    },
    cakeShapeName: { type: String, default: '' },
    pricingMethod: {
      type: String,
      enum: ['perunit', 'perkg'],
      required: true,
    },
    quantity: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    unitBasePrice: { type: Number, required: true, min: 0 },
    flavorExtraPrice: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    specialInstructions: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, required: true },
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true,
      index: true,
    },
    deliveryAddressId: { type: String },
    deliveryAddress: { type: DeliveryAddressSchema },
    orderDateTime: { type: Date, required: true, index: true },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (items: unknown[]) => Array.isArray(items) && items.length > 0,
        message: 'At least one order item is required',
      },
    },
    notes: { type: String, default: '' },
    subTotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'ready', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ deliveryMethod: 1, orderDateTime: 1 });

if (process.env.NODE_ENV !== 'production' && models.Order) {
  delete models.Order;
}

export default models.Order || model('Order', OrderSchema);
