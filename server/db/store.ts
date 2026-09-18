import fs from 'fs';
import path from 'path';
import { Responder, CallLog, DispatchAuditRecord } from '../../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const RESPONDERS_FILE = path.join(DATA_DIR, 'responders.json');
const CALL_LOGS_FILE = path.join(DATA_DIR, 'call_logs.json');
const AUDITS_FILE = path.join(DATA_DIR, 'dispatch_audits.json');

// Ensure data directory exists
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
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initial 5 prototype responders with authorized test numbers
const DEFAULT_RESPONDERS: Responder[] = [
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

class PersistentStore {
  private responders: Map<string, Responder> = new Map();
  private callLogs: Map<string, CallLog> = new Map();
  private audits: DispatchAuditRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const loadedResponders = readJsonFile<Responder[]>(RESPONDERS_FILE, []);
    if (loadedResponders.length === 0) {
      DEFAULT_RESPONDERS.forEach(r => this.responders.set(r.id, r));
      this.saveResponders();
    } else {
      loadedResponders.forEach(r => this.responders.set(r.id, r));
    }

    const loadedLogs = readJsonFile<CallLog[]>(CALL_LOGS_FILE, []);
    loadedLogs.forEach(log => this.callLogs.set(log.callId, log));

    this.audits = readJsonFile<DispatchAuditRecord[]>(AUDITS_FILE, []);
  }

  private saveResponders() {
    writeJsonFile(RESPONDERS_FILE, Array.from(this.responders.values()));
  }

  private saveCallLogs() {
    writeJsonFile(CALL_LOGS_FILE, Array.from(this.callLogs.values()));
  }

  private saveAudits() {
    writeJsonFile(AUDITS_FILE, this.audits);
  }

  // Responder CRUD
  getResponders(): Responder[] {
    return Array.from(this.responders.values());
  }

  getResponderById(id: string): Responder | undefined {
    return this.responders.get(id);
  }

  saveResponder(responder: Responder): Responder {
    responder.updatedAt = new Date().toISOString();
    this.responders.set(responder.id, responder);
    this.saveResponders();
    return responder;
  }

  updateResponder(id: string, updates: Partial<Responder>): Responder | null {
    const existing = this.responders.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.responders.set(id, updated);
    this.saveResponders();
    return updated;
  }

  // CallLog CRUD
  getCallLogs(): CallLog[] {
    return Array.from(this.callLogs.values()).sort(
      (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime()
    );
  }

  getCallLog(callId: string): CallLog | undefined {
    return this.callLogs.get(callId);
  }

  getCallLogsForIncident(incidentId: string): CallLog[] {
    return this.getCallLogs().filter(c => c.incidentId === incidentId || c.hotspotId === incidentId);
  }

  saveCallLog(log: CallLog): CallLog {
    log.updatedAt = new Date().toISOString();
    this.callLogs.set(log.callId, log);
    this.saveCallLogs();
    return log;
  }

  updateCallLog(callId: string, updates: Partial<CallLog>): CallLog | null {
    const existing = this.callLogs.get(callId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If new timeline entry or note, append
    if (updates.status && updates.status !== existing.status) {
      const note = updates.errorMessage || `Call status transitioned to ${updates.status}`;
      updated.timeline = [
        ...existing.timeline,
        {
          status: updates.status,
          timestamp: new Date().toISOString(),
          note
        }
      ];
    }

    this.callLogs.set(callId, updated);
    this.saveCallLogs();
    return updated;
  }

  // Audit Logs
  getAudits(): DispatchAuditRecord[] {
    return [...this.audits].sort(
      (a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()
    );
  }

  addAudit(audit: DispatchAuditRecord): void {
    this.audits.unshift(audit);
    this.saveAudits();
  }

  updateAuditResult(dispatchId: string, finalResults: string): void {
    const item = this.audits.find(a => a.dispatchId === dispatchId);
    if (item) {
      item.finalResults = finalResults;
      this.saveAudits();
    }
  }
}

export const dbStore = new PersistentStore();
