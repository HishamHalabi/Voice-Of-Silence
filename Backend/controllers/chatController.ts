import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import ttsService from '../services/ttsService';
import { successResponse, paginatedResponse, createError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

const sendMessageSchema = Joi.object({
    receiverId: Joi.string().required(),
    message: Joi.string().max(1000),
    messageType: Joi.string().valid('text', 'voice').default('text'),
    isGloveInput: Joi.boolean().default(false)
}).custom((value, helpers) => {
    if (value.messageType === 'text' && !value.message) {
        return helpers.error('any.required', { field: 'message' });
    }
    return value;
});

/**
 * @route   POST /api/chat/send
 * @desc    Send a message (text or voice)
 * @access  Private
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { error, value } = sendMessageSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const { receiverId, message, messageType, isGloveInput } = value;

        const messageData: any = {
            sender: req.user.id,
            receiver: receiverId,
            messageType,
            isGloveInput
        };

        if (isGloveInput && message) {
            try {
                const audioResult = await ttsService.textToSpeech(message, 'ar');
                messageData.messageType = 'voice'; 
                messageData.audioPath = `data:audio/mp3;base64,${audioResult.audioContent}`;
                messageData.message = message; 
            } catch (ttsError: any) {
                logger.error(`Glove TTS generation failed: ${ttsError.message}`);
            }
        } else if (messageType === 'text') {
            messageData.message = message;
        } else if (messageType === 'voice') {
            if (!req.file) {
                return next(createError('Voice file is required for voice messages', 400));
            }

            messageData.audioPath = `/public/audio/chat/${req.file.filename}`;
        }

        const chatMessage = await Chat.create(messageData);

        await chatMessage.populate('sender receiver', 'name email');

        const io = req.app.get('io');
        io.to(receiverId).emit('newMessage', chatMessage);

        logger.info(`Message sent from ${req.user.email} to ${receiverId} (Type: ${messageData.messageType})`);

        res.status(201).json(successResponse(
            'Message sent successfully',
            { message: chatMessage },
            201
        ));
    } catch (error: any) {
        logger.error(`Send message error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/chat/messages
 * @desc    Get messages between two users
 * @access  Private
 */
export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { userId } = req.query;

        if (!userId) {
            return next(createError('userId query parameter is required', 400));
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const query = {
            $or: [
                { sender: req.user.id, receiver: userId },
                { sender: userId, receiver: req.user.id }
            ],
            isDeleted: false
        };

        const [messages, total] = await Promise.all([
            Chat.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sender receiver', 'name email'),
            Chat.countDocuments(query)
        ]);

        res.json(paginatedResponse(messages, page, limit, total));
    } catch (error: any) {
        logger.error(`Get messages error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/chat/conversations
 * @desc    Get list of conversations for current user
 * @access  Private
 */
export const getConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const userId = new mongoose.Types.ObjectId(req.user.id);

        const conversations = await Chat.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ],
                    isDeleted: false
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiver', userId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    user: {
                        _id: 1,
                        name: 1,
                        email: 1
                    },
                    lastMessage: 1,
                    unreadCount: 1
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.json(successResponse(
            'Conversations fetched successfully',
            { conversations }
        ));
    } catch (error: any) {
        logger.error(`Get conversations error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   PUT /api/chat/read/:messageId
 * @desc    Mark message as read
 * @access  Private
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const message = await Chat.findById(req.params.messageId);

        if (!message) {
            return next(createError('Message not found', 404));
        }

        if (message.receiver.toString() !== req.user.id) {
            return next(createError('Not authorized to mark this message as read', 403));
        }

        await message.markAsRead();

        res.json(successResponse('Message marked as read'));
    } catch (error: any) {
        logger.error(`Mark as read error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   DELETE /api/chat/:messageId
 * @desc    Delete message (soft delete)
 * @access  Private
 */
export const deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const message = await Chat.findById(req.params.messageId);

        if (!message) {
            return next(createError('Message not found', 404));
        }

        if (message.sender.toString() !== req.user.id) {
            return next(createError('Not authorized to delete this message', 403));
        }

        message.isDeleted = true;
        await message.save();

        logger.info(`Message deleted: ${message._id}`);

        res.json(successResponse('Message deleted successfully'));
    } catch (error: any) {
        logger.error(`Delete message error: ${error.message}`);
        next(error);
    }
};

