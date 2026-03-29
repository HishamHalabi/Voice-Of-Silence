import express from 'express';
const router = express.Router();
import {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead,
    deleteMessage
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';
import { uploadAudio } from '../middleware/uploadMiddleware';

/**
 * @openapi
 * /api/chat/send:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message (text or voice)
 *     description: Supports regular text messages and glove-generated text/voice messages.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - message
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID of the recipient user
 *               message:
 *                 type: string
 *                 description: Text content of the message
 *               messageType:
 *                 type: string
 *                 enum: [text, voice]
 *                 default: text
 *               isGloveInput:
 *                 type: boolean
 *                 default: false
 *                 description: Set to true if message was generated from glove gestures
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *               message:
 *                 type: string
 *               audio:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/send', protect, uploadAudio.single('audio'), sendMessage);


/**
 * @openapi
 * /api/chat/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get messages between users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the other user in the conversation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of messages retrieved successfully
 */
router.get('/messages', protect, getMessages);

/**
 * @openapi
 * /api/chat/conversations:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get user conversations
 *     description: Retrieve a list of all users the current user has interacted with, including the last message and unread count.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/conversations', protect, getConversations);

/**
 * @openapi
 * /api/chat/read/{messageId}:
 *   put:
 *     tags:
 *       - Chat
 *     summary: Mark message as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/read/:messageId', protect, markAsRead);

/**
 * @openapi
 * /api/chat/{messageId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Delete message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:messageId', protect, deleteMessage);

export default router;
