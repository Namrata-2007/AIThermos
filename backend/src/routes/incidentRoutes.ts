import { Router } from 'express';
import { getIncidents, getThermalEvents, getIndustrialSites } from '../controllers/incidentController.ts';

const router = Router();

router.get('/incidents', getIncidents);
router.get('/thermal-events', getThermalEvents);
router.get('/industrial-sites', getIndustrialSites);

export default router;
