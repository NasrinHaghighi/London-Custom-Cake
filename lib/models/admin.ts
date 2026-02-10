import { Schema, models, model } from "mongoose";

const AdminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },

    passwordHash: { type: String }, // empty until set
    token: { type: String },
    tokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
// 1. Email index - Fast login by email (already unique, but explicit index)
AdminSchema.index({ email: 1 });

// 2. Phone index - Fast login by phone (already unique, but explicit index)
AdminSchema.index({ phone: 1 });

// 3. Token index - Fast password reset token lookup
AdminSchema.index({ token: 1 });

// 4. Compound index - Find valid tokens (not expired)
AdminSchema.index({ token: 1, tokenExpiresAt: 1 });

export default models.Admin || model("Admin", AdminSchema);

