import { Response, NextFunction } from 'express';
import Joi from 'joi';
import Session from '../models/Session';
import Device from '../models/Device';
import { successResponse, createError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

// Validation schemas
const startSessionSchema = Joi.object({
    deviceId: Joi.string().required().messages({
        'any.required': 'Device ID is required to start a session'
    }),
    language: Joi.string().valid('ar', 'en').default('ar')
});

const completeSessionSchema = Joi.object({
    metrics: Joi.object({
        totalLetters: Joi.number().min(0),
        accuracy: Joi.number().min(0).max(1)
    }),
    status: Joi.string().valid('completed', 'cancelled').default('completed')
});

/**
 * @route   POST /api/sessions/start
 * @desc    Start a new interaction session
 * @access  Private
 */
export const startSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { error, value } = startSessionSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        // Verify device exists and belongs to user
        const device = await Device.findOne({ deviceId: value.deviceId, user: req.user.id });
        if (!device) {
            return next(createError('Device not found or not registered to your account', 404));
        }

        // Check for existing active sessions
        const activeSession = await Session.findOne({ user: req.user.id, status: 'active' });
        if (activeSession) {
            // Automatically complete previous session
            activeSession.status = 'completed';
            activeSession.endTime = new Date();
            await activeSession.save();
        }

        const session = await Session.create({
            ...value,
            user: req.user.id,
            startTime: new Date()
        });

        logger.info(`Session started for user ${req.user.email} using device ${value.deviceId}`);

        res.status(201).json(successResponse('Session started successfully', { session }, 201));
    } catch (error: any) {
        logger.error(`Start session error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   POST /api/sessions/:id/complete
 * @desc    Complete or cancel a session
 * @access  Private
 */
export const completeSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { error, value } = completeSessionSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const session = await Session.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, status: 'active' },
            {
                ...value,
                endTime: new Date(),
                status: value.status || 'completed'
            },
            { new: true, runValidators: true }
        );

        if (!session) {
            return next(createError('Active session not found or already completed', 404));
        }

        logger.info(`Session ${req.params.id} completed for user ${req.user.email}`);

        res.json(successResponse('Session completed successfully', { session }));
    } catch (error: any) {
        logger.error(`Complete session error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/sessions/history
 * @desc    Get session history
 * @access  Private
 */
export const getSessionHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const sessions = await Session.find({ user: req.user.id })
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Session.countDocuments({ user: req.user.id });

        res.json(successResponse('Session history fetched successfully', {
            sessions,
            total,
            page,
            limit
        }));
    } catch (error: any) {
        logger.error(`Get session history error: ${error.message}`);
        next(error);
    }
};
