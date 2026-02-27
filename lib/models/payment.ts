import { Schema, model, models } from 'mongoose';

const PaymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['payment', 'refund'],
      default: 'payment',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mbway'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    proofImageDataUrl: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    receivedByName: {
      type: String,
      required: true,
      trim: true,
      default: '',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ orderId: 1, receivedAt: -1 });

if (process.env.NODE_ENV !== 'production' && models.Payment) {
  delete models.Payment;
}

export default models.Payment || model('Payment', PaymentSchema);
