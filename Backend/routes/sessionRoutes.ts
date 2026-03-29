import express from 'express';
const router = express.Router();
import {
    startSession,
    completeSession,
    getSessionHistory
} from '../controllers/sessionController';
import { protect } from '../middleware/authMiddleware';

router.use(protect);

router.post('/start', startSession);
router.post('/:id/complete', completeSession);
router.get('/history', getSessionHistory);

export default router;
