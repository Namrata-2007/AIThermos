import { Router } from 'express';
import healthRoutes from './healthRoutes.ts';
import satelliteRoutes from './satelliteRoutes.ts';
import incidentRoutes from './incidentRoutes.ts';
import responderRoutes from './responderRoutes.ts';
import telephonyRoutes from './telephonyRoutes.ts';
import webhookRoutes from './webhookRoutes.ts';
import aiRoutes from './aiRoutes.ts';

const router = Router();

router.use(healthRoutes);
router.use(satelliteRoutes);
router.use(incidentRoutes);
router.use(responderRoutes);
router.use(telephonyRoutes);
router.use(webhookRoutes);
router.use(aiRoutes);

export default router;
