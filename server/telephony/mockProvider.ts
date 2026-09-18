import { TelephonyProvider, TelephonyCallRequest, TelephonyCallResult } from './types.ts';
import { dbStore } from '../db/store.ts';

export class MockTelephonyProvider implements TelephonyProvider {
  public name: 'MockTelephonyProvider' = 'MockTelephonyProvider';
  private activeTimers: Map<string, NodeJS.Timeout[]> = new Map();

  isConfigured(): boolean {
    return true;
  }

  async initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResult> {
    const providerCallId = `mock-call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Determine target simulated outcome
    // If request specifies desiredOutcome, honor it.
    // Otherwise, assign a realistic outcome: default mostly ANSWERED, occasionally NO_ANSWER or BUSY if requested
    const outcome = request.desiredOutcome || 'ANSWERED';

    const timers: NodeJS.Timeout[] = [];

    // Stage 1: INITIATING (1.0s)
    const timer1 = setTimeout(() => {
      const call = dbStore.getCallLog(request.callId);
      if (!call || call.status === 'CANCELLED' || call.status === 'COMPLETED') return;

      dbStore.updateCallLog(request.callId, {
        status: 'INITIATING',
        initiatedAt: new Date().toISOString()
      });

      // Stage 2: RINGING (2.2s after initiating)
      const timer2 = setTimeout(() => {
        const callRinging = dbStore.getCallLog(request.callId);
        if (!callRinging || callRinging.status === 'CANCELLED' || callRinging.status === 'COMPLETED') return;

        dbStore.updateCallLog(request.callId, {
          status: 'RINGING',
          ringingAt: new Date().toISOString()
        });

        // Stage 3: OUTCOME DECISION
        if (outcome === 'ANSWERED') {
          // Ring for 2.5s then ANSWER
          const timer3 = setTimeout(() => {
            const callAnswered = dbStore.getCallLog(request.callId);
            if (!callAnswered || callAnswered.status === 'CANCELLED' || callAnswered.status === 'COMPLETED') return;

            const answeredTime = new Date();
            dbStore.updateCallLog(request.callId, {
              status: 'ANSWERED',
              answeredAt: answeredTime.toISOString()
            });

            // Stage 4: CALL IN CONVERSATION (simulate 15 seconds of emergency dispatch audio transmission)
            // Then auto-complete if not hung up
            const timer4 = setTimeout(() => {
              const callFinal = dbStore.getCallLog(request.callId);
              if (!callFinal || callFinal.status !== 'ANSWERED') return;

              const completedTime = new Date();
              const durationSecs = Math.max(1, Math.round((completedTime.getTime() - answeredTime.getTime()) / 1000));

              dbStore.updateCallLog(request.callId, {
                status: 'COMPLETED',
                completedAt: completedTime.toISOString(),
                duration: durationSecs
              });
              this.activeTimers.delete(providerCallId);
            }, 14000);

            timers.push(timer4);
          }, 2500);

          timers.push(timer3);

        } else if (outcome === 'NO_ANSWER') {
          // Ring for 5s then NO_ANSWER
          const timerNoAns = setTimeout(() => {
            const callCur = dbStore.getCallLog(request.callId);
            if (!callCur || callCur.status === 'CANCELLED') return;

            dbStore.updateCallLog(request.callId, {
              status: 'NO_ANSWER',
              completedAt: new Date().toISOString(),
              duration: 0,
              errorMessage: 'Line rang for 45s without answer at remote responder unit.'
            });
            this.activeTimers.delete(providerCallId);
          }, 5000);
          timers.push(timerNoAns);

        } else if (outcome === 'BUSY') {
          const timerBusy = setTimeout(() => {
            dbStore.updateCallLog(request.callId, {
              status: 'BUSY',
              completedAt: new Date().toISOString(),
              duration: 0,
              errorMessage: 'Responder terminal returned carrier busy signal (486 Busy Here).'
            });
            this.activeTimers.delete(providerCallId);
          }, 2500);
          timers.push(timerBusy);

        } else if (outcome === 'FAILED') {
          const timerFail = setTimeout(() => {
            dbStore.updateCallLog(request.callId, {
              status: 'FAILED',
              completedAt: new Date().toISOString(),
              duration: 0,
              errorMessage: 'Cellular network trunk unavailable in tactical sector.'
            });
            this.activeTimers.delete(providerCallId);
          }, 1500);
          timers.push(timerFail);
        }

      }, 1200);

      timers.push(timer2);
    }, 1000);

    timers.push(timer1);
    this.activeTimers.set(providerCallId, timers);

    return {
      providerCallId,
      provider: 'MockTelephonyProvider',
      initialStatus: 'QUEUED',
      message: 'Simulated telephony test call queued via MockTelephonyProvider.'
    };
  }

  async getCallStatus(providerCallId: string) {
    // Find log by providerCallId
    const all = dbStore.getCallLogs();
    const log = all.find(c => c.providerCallId === providerCallId);
    if (!log) {
      return { status: 'FAILED' as const, error: 'Call not found' };
    }
    return {
      status: log.status,
      duration: log.duration,
      error: log.errorMessage
    };
  }

  async hangupCall(providerCallId: string): Promise<boolean> {
    const timers = this.activeTimers.get(providerCallId);
    if (timers) {
      timers.forEach(t => clearTimeout(t));
      this.activeTimers.delete(providerCallId);
    }

    const all = dbStore.getCallLogs();
    const log = all.find(c => c.providerCallId === providerCallId);
    if (log && log.status !== 'COMPLETED' && log.status !== 'FAILED') {
      const now = new Date();
      let duration = log.duration;
      if (log.answeredAt) {
        duration = Math.max(1, Math.round((now.getTime() - new Date(log.answeredAt).getTime()) / 1000));
      }
      dbStore.updateCallLog(log.callId, {
        status: log.answeredAt ? 'COMPLETED' : 'CANCELLED',
        completedAt: now.toISOString(),
        duration
      });
      return true;
    }
    return false;
  }
}
