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

export default models.Admin || model("Admin", AdminSchema);

