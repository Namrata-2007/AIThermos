import { Request, Response } from 'express';
import { isDbConnected } from '../services/db.ts';
import { satelliteManager } from '../services/satellite/index.ts';
import { telephonyManager } from '../services/telephony/index.ts';

export function getHealth(req: Request, res: Response) {
  const satStatus = satelliteManager.getStatus();
  const telStatus = telephonyManager.getStatus();

  res.json({
    status: 'ok',
    service: 'THERMOS API',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: isDbConnected() ? 'MongoDB' : 'Local JSON / Memory Fallback',
      connected: isDbConnected()
    },
    satellite: {
      mode: satStatus.activeMode,
      provider: satStatus.activeProvider
    },
    telephony: {
      mode: telStatus.activeMode,
      twilioConfigured: telStatus.twilioConfigured,
      twilioPhoneNumber: telStatus.twilioPhoneNumber
    }
  });
}
