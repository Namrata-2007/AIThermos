import { Router } from 'express';
import { explainThermalEvent, analyzeEvidencePacket } from '../controllers/aiController.ts';

const router = Router();

router.post('/ai/explain', explainThermalEvent);
router.post('/ai-explain', explainThermalEvent);
router.post('/ai/analyze-evidence', analyzeEvidencePacket);

export default router;
