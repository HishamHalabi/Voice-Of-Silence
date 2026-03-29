import express from 'express';
const router = express.Router();
import {
    registerDevice,
    getMyDevices,
    updateDevice,
    deleteDevice
} from '../controllers/deviceController';
import { protect } from '../middleware/authMiddleware';

router.use(protect);

router.post('/', registerDevice);
router.get('/', getMyDevices);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

export default router;
