import express from 'express';
const router = express.Router();
import {
    processSensorData,
    speakRealTime,
    getGestureHistory,
    calibrateGlove,
    getStatistics
} from '../controllers/gloveController';
import { protect } from '../middleware/authMiddleware';

/**
 * @openapi
 * /api/glove/process:
 *   post:
 *     tags:
 *       - Glove
 *     summary: Process sensor data and predict letter
 *     description: Analyzes 7 flex sensor values to identify Arabic gestures.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sensorData
 *             properties:
 *               sensorData:
 *                 type: object
 *                 required:
 *                   - flexSensors
 *                 properties:
 *                   flexSensors:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 7
 *                     maxItems: 7
 *                     example: [1, 1, 0, 0, 0, 1, 0]
 *               letter:
 *                 type: string
 *                 description: Predicted letter from frontend (if isFrontendData is true)
 *               confidence:
 *                 type: number
 *               isFrontendData:
 *                 type: boolean
 *                 default: false
 *               isTrainingData:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Prediction results or data saved successfully
 */
router.post('/process', protect, processSensorData);

/**
 * @openapi
 * /api/glove/speak:
 *   post:
 *     tags:
 *       - Glove
 *     summary: Real-time gesture to speech
 *     description: |
 *       Converts accumulated text into high-quality Arabic speech.
 *       The processed sentence is automatically saved to the user's Chat history (isGloveInput: true) 
 *       to track 'Messages Sent' statistics.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "السلام عليكم"
 *               action:
 *                 type: string
 *                 enum: [addLetter, complete, speakText, Text]
 *                 default: "Text"
 *     responses:
 *       200:
 *         description: Audio generated successfully
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
 *                     audio:
 *                       type: object
 *                       properties:
 *                         base64:
 *                           type: string
 */
router.post('/speak', protect, speakRealTime);

/**
 * @openapi
 * /api/glove/history:
 *   get:
 *     tags:
 *       - Glove
 *     summary: Get gesture history
 *     description: Retrieve a paginated list of previous gesture predictions for the current user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/history', protect, getGestureHistory);

/**
 * @openapi
 * /api/glove/calibrate:
 *   post:
 *     tags:
 *       - Glove
 *     summary: Calibrate glove
 *     description: Record baseline sensor data to improve prediction accuracy.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flexSensors:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Calibration data saved successfully
 */
router.post('/calibrate', protect, calibrateGlove);

/**
 * @openapi
 * /api/glove/stats:
 *   get:
 *     tags:
 *       - Glove
 *     summary: Get gesture statistics
 *     description: Get counts and average confidence for each predicted gesture.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', protect, getStatistics);


export default router;
