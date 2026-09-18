import mongoose, { Schema, Document } from 'mongoose';

export type CallStatus = 
  | 'QUEUED' 
  | 'RINGING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'BUSY' 
  | 'NO_ANSWER' 
  | 'FAILED' 
  | 'CANCELLED';

export interface ICallTimelineEntry {
  status: CallStatus;
  timestamp: string;
  note?: string;
}

export interface ICallLog extends Document {
  callId: string;
  dispatchId: string;
  incidentId: string;
  hotspotId?: string;
  responderId: string;
  responderName: string;
  role: string;
  phoneNumber: string;
  mode: 'TEST' | 'LIVE';
  provider: string;
  providerCallId?: string;
  status: CallStatus;
  queuedAt: string;
  initiatedAt?: string;
  ringingAt?: string;
  answeredAt?: string;
  completedAt?: string;
  duration: number; // in seconds
  recordingUrl?: string;
  transcript?: string;
  errorMessage?: string;
  timeline: ICallTimelineEntry[];
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  frp?: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  classification?: string;
  createdAt: string;
  updatedAt: string;
}

const CallLogSchema = new Schema<ICallLog>({
  callId: { type: String, required: true, unique: true, index: true },
  dispatchId: { type: String, required: true, index: true },
  incidentId: { type: String, required: true, index: true },
  hotspotId: { type: String },
  responderId: { type: String, required: true },
  responderName: { type: String, required: true },
  role: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  mode: { type: String, enum: ['TEST', 'LIVE'], default: 'TEST' },
  provider: { type: String, required: true },
  providerCallId: { type: String },
  status: { 
    type: String, 
    enum: ['QUEUED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'BUSY', 'NO_ANSWER', 'FAILED', 'CANCELLED'],
    default: 'QUEUED'
  },
  queuedAt: { type: String, required: true },
  initiatedAt: { type: String },
  ringingAt: { type: String },
  answeredAt: { type: String },
  completedAt: { type: String },
  duration: { type: Number, default: 0 },
  recordingUrl: { type: String },
  transcript: { type: String },
  errorMessage: { type: String },
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    note: { type: String }
  }],
  location: { type: String },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  frp: { type: Number },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] },
  classification: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const CallLogModel = mongoose.models.CallLog || mongoose.model<ICallLog>('CallLog', CallLogSchema);
