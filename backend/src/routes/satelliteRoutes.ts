import { Router } from 'express';
import { 
  getSatellites, 
  getObservations, 
  getHotspots, 
  getLocations, 
  getCorridors, 
  getFirms, 
  assessOccurrences 
} from '../controllers/satelliteController.ts';

const router = Router();

router.get('/satellites', getSatellites);
router.get('/observations', getObservations);
router.get('/hotspots', getHotspots);
router.get('/locations', getLocations);
router.get('/corridors', getCorridors);
router.get('/firms', getFirms);
router.get('/occurrences/assess', assessOccurrences);

export default router;
