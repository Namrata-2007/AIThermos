import mongoose, { Schema, Document } from 'mongoose';

export interface IDispatchResponderSummary {
  id: string;
  name: string;
  role: string;
  phoneNumber: string;
  callId: string;
  status: string;
}

export interface IDispatchAudit extends Document {
  dispatchId: string;
  incidentId: string;
  hotspotId?: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  initiatedAt: string;
  initiatedBy: string;
  mode: 'TEST' | 'LIVE';
  selectedResponderIds: string[];
  responders: IDispatchResponderSummary[];
  finalResults?: string;
  createdAt: string;
  updatedAt: string;
}

const DispatchAuditSchema = new Schema<IDispatchAudit>({
  dispatchId: { type: String, required: true, unique: true, index: true },
  incidentId: { type: String, required: true, index: true },
  hotspotId: { type: String },
  location: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  initiatedAt: { type: String, required: true },
  initiatedBy: { type: String, default: 'Tactical Operator Console' },
  mode: { type: String, enum: ['TEST', 'LIVE'], default: 'TEST' },
  selectedResponderIds: [{ type: String }],
  responders: [{
    id: String,
    name: String,
    role: String,
    phoneNumber: String,
    callId: String,
    status: String
  }],
  finalResults: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const DispatchAuditModel = mongoose.models.DispatchAudit || mongoose.model<IDispatchAudit>('DispatchAudit', DispatchAuditSchema);
