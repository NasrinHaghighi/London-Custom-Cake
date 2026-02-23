import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema(
  {
    label: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    notes: { type: String },
  },
  { _id: true }
);

const CustomerSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    notes: { type: String },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true }
);

// Indexes for performance
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ lastName: 1, firstName: 1 });

export default models.Customer || model("Customer", CustomerSchema);
