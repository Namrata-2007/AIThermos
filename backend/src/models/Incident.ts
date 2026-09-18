import mongoose, { Schema, Document } from 'mongoose';

export type IncidentStatus = 
  | 'MONITORING' 
  | 'EVALUATED' 
  | 'CRITICAL' 
  | 'DISPATCH_REQUESTED' 
  | 'DISPATCHED' 
  | 'RESOLVED';

export interface IIncident extends Document {
  incidentId: string;
  hotspotId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  country: string;
  region: string;
  industrialSite?: string;
  fireRisk: number;
  confidence: number;
  FRP: number;
  brightnessTemperature: number;
  satellite: string;
  observationTime: string;
  status: IncidentStatus;
  evidenceValid: boolean;
  distanceToIndustryKm?: number;
  createdAt: string;
  updatedAt: string;
}

const IncidentSchema = new Schema<IIncident>({
  incidentId: { type: String, required: true, unique: true, index: true },
  hotspotId: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  locationName: { type: String, required: true },
  country: { type: String, default: 'IN' },
  region: { type: String, default: 'Western Corridor' },
  industrialSite: { type: String },
  fireRisk: { type: Number, required: true },
  confidence: { type: Number, required: true },
  FRP: { type: Number, required: true },
  brightnessTemperature: { type: Number, required: true },
  satellite: { type: String, required: true },
  observationTime: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['MONITORING', 'EVALUATED', 'CRITICAL', 'DISPATCH_REQUESTED', 'DISPATCHED', 'RESOLVED'],
    default: 'EVALUATED'
  },
  evidenceValid: { type: Boolean, default: true },
  distanceToIndustryKm: { type: Number },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const IncidentModel = mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
