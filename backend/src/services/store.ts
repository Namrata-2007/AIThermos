import fs from 'fs';
import path from 'path';
import { isDbConnected } from './db.ts';
import { ResponderModel, IResponder } from '../models/Responder.ts';
import { CallLogModel, ICallLog } from '../models/CallLog.ts';
import { DispatchAuditModel, IDispatchAudit } from '../models/DispatchAudit.ts';
import { HotspotModel, IHotspot } from '../models/Hotspot.ts';
import { IncidentModel, IIncident } from '../models/Incident.ts';
import { logger } from '../utils/logger.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const RESPONDERS_FILE = path.join(DATA_DIR, 'responders.json');
const CALL_LOGS_FILE = path.join(DATA_DIR, 'call_logs.json');
const AUDITS_FILE = path.join(DATA_DIR, 'dispatch_audits.json');
const HOTSPOTS_FILE = path.join(DATA_DIR, 'hotspots.json');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    logger.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error(`Error writing ${filePath}:`, err);
  }
}

export const SEED_RESPONDERS = [
  {
    id: 'resp-fire-1',
    name: 'District Industrial Fire & Rescue Command',
    role: 'FIRE_RESCUE',
    roleLabel: 'Fire & Rescue',
    organization: 'Industrial Fire Services & Hazmat Division',
    phoneNumber: '+917841070875',
    location: 'Central Industrial Fire Station, Station Rd',
    active: true,
    notes: 'Heavy chemical foam tenders, 12,000L bowsers, Hazmat suit crew',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'resp-police-2',
    name: 'State Police & Civil Evacuation Force',
    role: 'POLICE',
    roleLabel: 'Police',
    organization: 'City & Industrial Area Police Command',
    phoneNumber: '+917709695196',
    location: 'Metropolitan Police Sub-Division 4',
    active: true,
    notes: 'Perimeter cordons, green traffic corridor clearance, megaphone warning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'resp-hospital-3',
    name: 'Regional Apex Trauma & Burn ICU Hospital',
    role: 'HOSPITAL_MEDICAL',
    roleLabel: 'Hospital / Medical',
    organization: 'Civil Medical Services & Trauma Center',
    phoneNumber: '+918180940073',
    location: 'District Civil Medical College & Hospital',
    active: true,
    notes: 'Dedicated Burn ICU ward, cyanide toxicity antidotes, triage staff',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'resp-ambulance-4',
    name: 'Emergency ALS Ambulance Corps',
    role: 'AMBULANCE',
    roleLabel: 'Ambulance',
    organization: 'Advanced Life Support Ambulance Network',
    phoneNumber: '+917020633155',
    location: 'Mobile EMS Unit Standby Station',
    active: true,
    notes: 'Paramedic burn resuscitation, oxygenation, ventilator support',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'resp-disaster-5',
    name: 'District Disaster Management Authority (DDMA)',
    role: 'DISASTER_MANAGEMENT',
    roleLabel: 'Disaster Management',
    organization: 'Emergency Operations Center (EOC)',
    phoneNumber: '+918767720313',
    location: 'Collectorate EOC Command Bunker',
    active: true,
    notes: 'Multi-department coordination, civil defense shelters, siren activation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class UnifiedStore {
  private localResponders: any[] = [];
  private localCallLogs: any[] = [];
  private localAudits: any[] = [];
  private localHotspots: any[] = [];
  private localIncidents: any[] = [];

  constructor() {
    this.localResponders = readJsonFile<any[]>(RESPONDERS_FILE, []);
    this.localCallLogs = readJsonFile<any[]>(CALL_LOGS_FILE, []);
    this.localAudits = readJsonFile<any[]>(AUDITS_FILE, []);
    this.localHotspots = readJsonFile<any[]>(HOTSPOTS_FILE, []);
    this.localIncidents = readJsonFile<any[]>(INCIDENTS_FILE, []);

    this.ensureSeedResponders();
  }

  public async ensureSeedResponders() {
    // Seed local file store
    let modified = false;
    for (const seed of SEED_RESPONDERS) {
      const idx = this.localResponders.findIndex(r => r.id === seed.id || r.phoneNumber === seed.phoneNumber);
      if (idx === -1) {
        this.localResponders.push({ ...seed });
        modified = true;
      }
    }
    if (modified || this.localResponders.length === 0) {
      writeJsonFile(RESPONDERS_FILE, this.localResponders);
    }

    // Seed MongoDB if connected
    if (isDbConnected()) {
      try {
        for (const seed of SEED_RESPONDERS) {
          const existing = await ResponderModel.findOne({ $or: [{ id: seed.id }, { phoneNumber: seed.phoneNumber }] });
          if (!existing) {
            await ResponderModel.create(seed);
          }
        }
      } catch (err) {
        logger.error('Error seeding MongoDB responders:', err);
      }
    }
  }

  // Responders
  public async getResponders(): Promise<any[]> {
    if (isDbConnected()) {
      try {
        const found = await ResponderModel.find({}).lean();
        if (found && found.length > 0) return found;
      } catch (err) {
        logger.error('MongoDB query error on getResponders:', err);
      }
    }
    return this.localResponders;
  }

  public async getResponderById(id: string): Promise<any | null> {
    if (isDbConnected()) {
      try {
        const found = await ResponderModel.findOne({ id }).lean();
        if (found) return found;
      } catch (err) {
        logger.error('MongoDB query error on getResponderById:', err);
      }
    }
    return this.localResponders.find(r => r.id === id) || null;
  }

  public async saveResponder(resp: any): Promise<any> {
    const now = new Date().toISOString();
    const toSave = {
      ...resp,
      updatedAt: now,
      createdAt: resp.createdAt || now
    };

    const idx = this.localResponders.findIndex(r => r.id === toSave.id);
    if (idx >= 0) {
      this.localResponders[idx] = toSave;
    } else {
      this.localResponders.push(toSave);
    }
    writeJsonFile(RESPONDERS_FILE, this.localResponders);

    if (isDbConnected()) {
      try {
        await ResponderModel.findOneAndUpdate({ id: toSave.id }, toSave, { upsert: true, new: true });
      } catch (err) {
        logger.error('MongoDB write error on saveResponder:', err);
      }
    }

    return toSave;
  }

  // Call Logs
  public async getCallLogs(): Promise<any[]> {
    if (isDbConnected()) {
      try {
        const found = await CallLogModel.find({}).sort({ createdAt: -1 }).lean();
        if (found && found.length > 0) return found;
      } catch (err) {
        logger.error('MongoDB query error on getCallLogs:', err);
      }
    }
    return [...this.localCallLogs].reverse();
  }

  public async getCallLogById(callId: string): Promise<any | null> {
    if (isDbConnected()) {
      try {
        const found = await CallLogModel.findOne({ callId }).lean();
        if (found) return found;
      } catch (err) {
        logger.error('MongoDB query error on getCallLogById:', err);
      }
    }
    return this.localCallLogs.find(c => c.callId === callId) || null;
  }

  public async getCallLogsByIncidentId(incidentId: string): Promise<any[]> {
    if (isDbConnected()) {
      try {
        const found = await CallLogModel.find({ incidentId }).sort({ createdAt: -1 }).lean();
        if (found) return found;
      } catch (err) {
        logger.error('MongoDB query error on getCallLogsByIncidentId:', err);
      }
    }
    return this.localCallLogs.filter(c => c.incidentId === incidentId).reverse();
  }

  public async saveCallLog(callLog: any): Promise<any> {
    const idx = this.localCallLogs.findIndex(c => c.callId === callLog.callId);
    if (idx >= 0) {
      this.localCallLogs[idx] = callLog;
    } else {
      this.localCallLogs.push(callLog);
    }
    writeJsonFile(CALL_LOGS_FILE, this.localCallLogs);

    if (isDbConnected()) {
      try {
        await CallLogModel.findOneAndUpdate({ callId: callLog.callId }, callLog, { upsert: true, new: true });
      } catch (err) {
        logger.error('MongoDB write error on saveCallLog:', err);
      }
    }

    return callLog;
  }

  public async updateCallLog(callId: string, updates: Partial<any>): Promise<any | null> {
    const existing = await this.getCallLogById(callId);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.status && updates.status !== existing.status) {
      const timeline = merged.timeline || [];
      timeline.push({
        status: updates.status,
        timestamp: new Date().toISOString(),
        note: updates.errorMessage || `Status changed to ${updates.status}`
      });
      merged.timeline = timeline;
    }

    return this.saveCallLog(merged);
  }

  // Dispatch Audits
  public async getDispatchAudits(): Promise<any[]> {
    if (isDbConnected()) {
      try {
        const found = await DispatchAuditModel.find({}).sort({ initiatedAt: -1 }).lean();
        if (found && found.length > 0) return found;
      } catch (err) {
        logger.error('MongoDB query error on getDispatchAudits:', err);
      }
    }
    return [...this.localAudits].reverse();
  }

  public async saveDispatchAudit(audit: any): Promise<any> {
    this.localAudits.push(audit);
    writeJsonFile(AUDITS_FILE, this.localAudits);

    if (isDbConnected()) {
      try {
        await DispatchAuditModel.findOneAndUpdate({ dispatchId: audit.dispatchId }, audit, { upsert: true });
      } catch (err) {
        logger.error('MongoDB write error on saveDispatchAudit:', err);
      }
    }

    return audit;
  }
}

export const unifiedStore = new UnifiedStore();
