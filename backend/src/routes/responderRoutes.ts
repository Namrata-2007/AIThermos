import { Router } from 'express';
import { 
  getResponders, 
  createResponder, 
  updateResponder, 
  testCallResponder 
} from '../controllers/responderController.ts';

const router = Router();

router.get('/responders', getResponders);
router.post('/responders', createResponder);
router.put('/responders/:id', updateResponder);
router.post('/responders/test-call/:id', testCallResponder);

export default router;
