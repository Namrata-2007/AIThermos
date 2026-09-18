import { TelephonyProvider, TelephonyCallRequest, TelephonyCallResult } from './types.ts';
import { unifiedStore } from '../store.ts';
import { logger } from '../../utils/logger.ts';

export class MockTelephonyProvider implements TelephonyProvider {
  public readonly name = 'MockTelephonyProvider';

  public isConfigured(): boolean {
    return true;
  }

  public async initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResult> {
    const providerCallId = `mock-call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    logger.info(`[TEST CALL / NO REAL PHONE CALL] Simulating emergency dispatch call to ${request.responderName} (${request.phoneNumber})`);

    // Stage 1: RINGING after 1.2s
    setTimeout(async () => {
      const call = await unifiedStore.getCallLogById(request.callId);
      if (!call || call.status === 'CANCELLED' || call.status === 'COMPLETED') return;

      await unifiedStore.updateCallLog(request.callId, {
        status: 'RINGING',
        ringingAt: new Date().toISOString(),
        timeline: [
          ...(call.timeline || []),
          {
            status: 'RINGING',
            timestamp: new Date().toISOString(),
            note: 'TEST CALL / NO REAL PHONE CALL: Simulated telephone is ringing at destination station.'
          }
        ]
      });

      // Stage 2: IN_PROGRESS (ANSWERED) after 2.5s
      setTimeout(async () => {
        const ringingCall = await unifiedStore.getCallLogById(request.callId);
        if (!ringingCall || ringingCall.status === 'CANCELLED' || ringingCall.status === 'COMPLETED') return;

        await unifiedStore.updateCallLog(request.callId, {
          status: 'IN_PROGRESS',
          answeredAt: new Date().toISOString(),
          timeline: [
            ...(ringingCall.timeline || []),
            {
              status: 'IN_PROGRESS',
              timestamp: new Date().toISOString(),
              note: 'TEST CALL / NO REAL PHONE CALL: Dispatcher answered simulated audio line. Transmitting emergency incident telemetry.'
            }
          ]
        });

        // Stage 3: COMPLETED after 6s
        setTimeout(async () => {
          const activeCall = await unifiedStore.getCallLogById(request.callId);
          if (!activeCall || activeCall.status !== 'IN_PROGRESS') return;

          await unifiedStore.updateCallLog(request.callId, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            duration: 8,
            timeline: [
              ...(activeCall.timeline || []),
              {
                status: 'COMPLETED',
                timestamp: new Date().toISOString(),
                note: 'TEST CALL / NO REAL PHONE CALL: Voice broadcast acknowledged. Simulated dispatch completed successfully.'
              }
            ]
          });
        }, 6000);

      }, 2500);

    }, 1200);

    return {
      success: true,
      providerCallId,
      initialStatus: 'QUEUED',
      isSimulated: true,
      message: 'TEST CALL / NO REAL PHONE CALL: Simulated call successfully queued.'
    };
  }

  public async hangupCall(providerCallId: string): Promise<boolean> {
    logger.info(`[TEST CALL] Hanging up simulated call ${providerCallId}`);
    return true;
  }
}
