import express from 'express';
const router = express.Router();
import {
    getAllVideos,
    getVideoById,
    streamVideo,
    uploadVideo,
    getStatistics
} from '../controllers/videoController';
import { protect, authorize } from '../middleware/authMiddleware';
import { uploadVideo as uploadVideoMiddleware } from '../middleware/uploadMiddleware';

/**
 * @openapi
 * /api/videos:
 *   get:
 *     tags:
 *       - Videos
 *     summary: Get all videos
 *     description: Retrieve educational sign language videos with optional filtering.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (alphabet, words, sentences, etc.)
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty (beginner, intermediate, advanced)
 *     responses:
 *       200:
 *         description: List of videos retrieved successfully
 */
router.get('/', getAllVideos);

/**
 * @openapi
 * /api/videos/stats:
 *   get:
 *     tags:
 *       - Videos
 *     summary: Get video statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', protect, getStatistics);

/**
 * @openapi
 * /api/videos/{id}:
 *   get:
 *     tags:
 *       - Videos
 *     summary: Get video by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', protect, getVideoById);

/**
 * @openapi
 * /api/videos/stream/{id}:
 *   get:
 *     tags:
 *       - Videos
 *     summary: Stream video
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video stream
 */
router.get('/stream/:id', streamVideo);

/**
 * @openapi
 * /api/videos/upload:
 *   post:
 *     tags:
 *       - Videos
 *     summary: Upload new video
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload successfully
 */
router.post('/upload', protect, authorize('admin'), uploadVideoMiddleware.single('video'), uploadVideo);

export default router;
