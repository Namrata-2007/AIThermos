import mongoose, { Schema, Document } from 'mongoose';

export interface IObservation extends Document {
  observationId: string;
  satellite: string;
  instrument: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  frp: number;
  brightnessTemperature: number;
  confidence: number;
  source: string;
  sourceProductId?: string;
  isDemo: boolean;
  notes?: string;
  createdAt: string;
}

const ObservationSchema = new Schema<IObservation>({
  observationId: { type: String, required: true, unique: true, index: true },
  satellite: { type: String, required: true },
  instrument: { type: String, required: true },
  timestamp: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  frp: { type: Number, required: true },
  brightnessTemperature: { type: Number, required: true },
  confidence: { type: Number, required: true },
  source: { type: String, required: true },
  sourceProductId: { type: String },
  isDemo: { type: Boolean, default: false },
  notes: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const ObservationModel = mongoose.models.Observation || mongoose.model<IObservation>('Observation', ObservationSchema);
