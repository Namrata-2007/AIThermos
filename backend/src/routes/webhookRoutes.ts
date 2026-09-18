import { Router } from 'express';
import { handleCallStatusWebhook, handleVoiceWebhook } from '../controllers/webhookController.ts';

const router = Router();

router.post('/calls/webhook/status', handleCallStatusWebhook);
router.all('/calls/webhook/voice', handleVoiceWebhook);
router.all('/telephony/voice-twiml', handleVoiceWebhook);

export default router;
