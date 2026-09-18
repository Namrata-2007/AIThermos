import { Router } from 'express';
import { 
  dispatchCalls, 
  getCalls, 
  getCallById, 
  getCallsByIncidentId, 
  retryCall, 
  hangupCall, 
  getProvidersStatus, 
  getDispatchAudits 
} from '../controllers/telephonyController.ts';

const router = Router();

router.post('/calls/dispatch', dispatchCalls);
router.get('/calls', getCalls);
router.get('/calls/:id', getCallById);
router.get('/calls/incident/:incidentId', getCallsByIncidentId);
router.post('/calls/:id/retry', retryCall);
router.post('/calls/:id/hangup', hangupCall);
router.get('/providers/status', getProvidersStatus);
router.get('/dispatch/audits', getDispatchAudits);

export default router;
