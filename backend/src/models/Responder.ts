import mongoose, { Schema, Document } from 'mongoose';

export type ResponderRole = 
  | 'FIRE_RESCUE' 
  | 'POLICE' 
  | 'HOSPITAL_MEDICAL' 
  | 'AMBULANCE' 
  | 'DISASTER_MANAGEMENT';

export interface IResponder extends Document {
  id: string;
  name: string;
  role: ResponderRole;
  roleLabel: string;
  organization: string;
  phoneNumber: string;
  location: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const ResponderSchema = new Schema<IResponder>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['FIRE_RESCUE', 'POLICE', 'HOSPITAL_MEDICAL', 'AMBULANCE', 'DISASTER_MANAGEMENT'],
    required: true 
  },
  roleLabel: { type: String, required: true },
  organization: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  location: { type: String, required: true },
  active: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const ResponderModel = mongoose.models.Responder || mongoose.model<IResponder>('Responder', ResponderSchema);
