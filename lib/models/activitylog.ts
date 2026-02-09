import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: string; // e.g., 'admin_added', 'admin_deleted', 'admin_deactivated', 'password_set'
  performedBy: string; // user/admin id who performed the action
  targetAdmin?: string; // affected admin id (if applicable)
  details?: string; // optional description or metadata
  timestamp: Date;
}

const ActivityLogSchema: Schema = new Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  targetAdmin: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
