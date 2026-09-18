import mongoose, { Schema, Document } from 'mongoose';

export type ThermalAnomalyStatus = 
  | 'THERMAL_ANOMALY' 
  | 'FIRE_CANDIDATE' 
  | 'HIGH_CONFIDENCE_CANDIDATE' 
  | 'CONFIRMED_BY_EXTERNAL_EVIDENCE';

export interface IHotspot extends Document {
  id: string;
  latitude: number;
  longitude: number;
  frp: number;
  brightnessTemperature: number;
  confidence: number;
  satellite: string;
  instrument: string;
  source: string;
  sourceProductId?: string;
  timestamp: string;
  status: ThermalAnomalyStatus;
  isDemo: boolean;
  notes?: string;
  nearestIndustrialSite?: {
    id: string;
    name: string;
    type: string;
    distanceKm: number;
  };
}

const HotspotSchema = new Schema<IHotspot>({
  id: { type: String, required: true, unique: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  frp: { type: Number, required: true },
  brightnessTemperature: { type: Number, required: true },
  confidence: { type: Number, required: true },
  satellite: { type: String, required: true },
  instrument: { type: String, required: true },
  source: { type: String, required: true },
  sourceProductId: { type: String },
  timestamp: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['THERMAL_ANOMALY', 'FIRE_CANDIDATE', 'HIGH_CONFIDENCE_CANDIDATE', 'CONFIRMED_BY_EXTERNAL_EVIDENCE'],
    default: 'THERMAL_ANOMALY'
  },
  isDemo: { type: Boolean, default: false },
  notes: { type: String },
  nearestIndustrialSite: {
    id: String,
    name: String,
    type: { type: String },
    distanceKm: Number
  }
}, { timestamps: true });

export const HotspotModel = mongoose.models.Hotspot || mongoose.model<IHotspot>('Hotspot', HotspotSchema);
