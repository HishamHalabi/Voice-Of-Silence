import express from 'express';
const router = express.Router();
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    findUserByEmail,
    getUserStats
} from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
router.get('/', protect, authorize('admin'), getAllUsers);


router.get('/:id', protect, getUserById);


router.put('/:id', protect, updateUser);


router.delete('/:id', protect, authorize('admin'), deleteUser);

/**
 * @openapi
 * /api/users/find:
 *   post:
 *     tags:
 *       - Users
 *     summary: Find user by email
 *     description: Used in chat to start a new conversation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: User found
 */
router.post('/find', protect, findUserByEmail);

/**
 * @openapi
 * /api/users/profile/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user profile stats
 *     description: Returns aggregated usage data including messages sent, gestures recognized, and total practice hours.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         messagesSent:
 *                           type: integer
 *                           description: Number of vocalized sentences and chat messages.
 *                         gesturesRecognized:
 *                           type: integer
 *                           description: Total number of gestures (predicted letters) captured.
 *                         totalHours:
 *                           type: number
 *                           format: float
 *                           description: Total active practice time in hours (calculated via gesture clustering).
 */
router.get('/profile/stats', protect, getUserStats);

export default router;
