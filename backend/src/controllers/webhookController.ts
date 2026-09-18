import { Request, Response } from 'express';
import { unifiedStore } from '../services/store.ts';
import { logger } from '../utils/logger.ts';

export async function handleCallStatusWebhook(req: Request, res: Response) {
  try {
    const { CallSid, CallStatus, CallDuration, From, To } = req.body || req.query;

    logger.info(`[TWILIO WEBHOOK] Status update for CallSid: ${CallSid} -> Status: ${CallStatus}, Duration: ${CallDuration}s`);

    if (CallSid) {
      const logs = await unifiedStore.getCallLogs();
      const matchingCall = logs.find(c => c.providerCallId === CallSid);

      if (matchingCall) {
        let mappedStatus: any = 'QUEUED';
        if (CallStatus === 'ringing') mappedStatus = 'RINGING';
        else if (CallStatus === 'in-progress') mappedStatus = 'IN_PROGRESS';
        else if (CallStatus === 'completed') mappedStatus = 'COMPLETED';
        else if (CallStatus === 'busy') mappedStatus = 'BUSY';
        else if (CallStatus === 'no-answer') mappedStatus = 'NO_ANSWER';
        else if (CallStatus === 'failed') mappedStatus = 'FAILED';
        else if (CallStatus === 'canceled') mappedStatus = 'CANCELLED';

        await unifiedStore.updateCallLog(matchingCall.callId, {
          status: mappedStatus,
          duration: parseInt(CallDuration || '0', 10),
          updatedAt: new Date().toISOString()
        });
      }
    }

    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (err: any) {
    logger.error('Error handling Twilio status webhook:', err.message);
    res.status(500).send('Error');
  }
}

export function handleVoiceWebhook(req: Request, res: Response) {
  const message = (req.query.msg as string) || (req.body?.msg as string) || 'Emergency Alert from THERMOS Satellite Industrial Thermal Monitoring. Dispatch units immediately.';
  const sanitized = message.replace(/[<>&"]/g, '');

  res.type('text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${sanitized}</Say><Pause length="1"/><Say>Repeating: ${sanitized}</Say></Response>`);
}
