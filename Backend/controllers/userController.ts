import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import User from '../models/User';
import Chat from '../models/Chat';
import GestureData from '../models/GestureData';
import Session from '../models/Session';
import { successResponse, paginatedResponse, createError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Validation schemas
const updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    isActive: Joi.boolean()
}).min(1); // At least one field must be present

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments()
        ]);

        res.json(paginatedResponse(users, page, limit, total));
    } catch (error: any) {
        logger.error(`Get all users error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return next(createError('User not found', 404));
        }

        // Users can only view their own profile unless they're admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return next(createError('Not authorized to view this profile', 403));
        }

        res.json(successResponse('User fetched successfully', { user }));
    } catch (error: any) {
        logger.error(`Get user error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        // Validate request body
        const { error, value } = updateUserSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        // Users can only update their own profile unless they're admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return next(createError('Not authorized to update this profile', 403));
        }

        // Check if email is being changed and if it's already taken
        if (value.email) {
            const existingUser = await User.findOne({
                email: value.email.toLowerCase(),
                _id: { $ne: req.params.id }
            });

            if (existingUser) {
                return next(createError('Email already in use', 409));
            }

            value.email = value.email.toLowerCase();
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            value,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return next(createError('User not found', 404));
        }

        logger.info(`User updated: ${user.email}`);

        res.json(successResponse('User updated successfully', { user }));
    } catch (error: any) {
        logger.error(`Update user error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private/Admin
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(createError('User not found', 404));
        }

        // Soft delete - just mark as inactive
        user.isActive = false;
        await user.save();

        logger.info(`User deleted (soft): ${user.email}`);

        res.json(successResponse('User deleted successfully'));
    } catch (error: any) {
        logger.error(`Delete user error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/users/available
 * @desc    Get all available users for chat (excludes current user)
 * @access  Private
 */
export const getAvailableUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const users = await User.find({
            _id: { $ne: req.user.id }, // Exclude current user
            isActive: true
        })
            .select('name email createdAt')
            .sort({ name: 1 })
            .limit(100);

        res.json(successResponse('Available users fetched successfully', { users }));
    } catch (error: any) {
        logger.error(`Get available users error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   POST /api/users/find
 * @desc    Find user by email (exact match)
 * @access  Private
 */
export const findUserByEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { email } = req.body;

        if (!email) {
            return next(createError('Email is required', 400));
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
            isActive: true
        }).select('name email _id');

        if (!user) {
            return next(createError('User not found with this email', 404));
        }

        // Prevent finding yourself
        if (user._id.toString() === req.user.id) {
            return next(createError('You cannot chat with yourself', 400));
        }

        res.json(successResponse('User found', { user }));
    } catch (error: any) {
        logger.error(`Find user error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/users/profile/stats
 * @desc    Get user statistics for profile dashboard
 * @access  Private
 */
export const getUserStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const userId = req.user.id;

        const [messageCount, gestureCount, allGestures] = await Promise.all([
            Chat.countDocuments({ sender: userId }),
            GestureData.countDocuments({ user: userId }),
            GestureData.find({ user: userId }).sort({ createdAt: 1 }).select('createdAt')
        ]);

        let totalMs = 0;
        const GAP_THRESHOLD = 10 * 60 * 1000; 
        const CLUSTER_BUFFER = 1 * 60 * 1000; 

        if (allGestures.length > 0) {
            let clusterStart = allGestures[0].createdAt.getTime();
            let lastGestureTime = clusterStart;

            for (let i = 1; i < allGestures.length; i++) {
                const currentTime = allGestures[i].createdAt.getTime();

                if (currentTime - lastGestureTime > GAP_THRESHOLD) {
                    totalMs += (lastGestureTime - clusterStart) + CLUSTER_BUFFER;
                    clusterStart = currentTime;
                }
                lastGestureTime = currentTime;
            }
            totalMs += (lastGestureTime - clusterStart) + CLUSTER_BUFFER;
        }

        const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));

        res.json(successResponse('Stats fetched successfully', {
            stats: {
                messagesSent: messageCount,
                gesturesRecognized: gestureCount,
                totalHours: totalHours
            }
        }));
    } catch (error: any) {
        logger.error(`Get user stats error: ${error.message}`);
        next(error);
    }
};

