import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/User';
import { successResponse, createError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin').default('user')
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const generateToken = (userId: any): string => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET as string,
        { expiresIn: (process.env.JWT_EXPIRE || '7d') as any }
    );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const { name, email, password, role } = value;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return next(createError('Email already registered', 409));
        }

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'user'
        });

        const token = generateToken(user._id);

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json(successResponse(
            'User registered successfully',
            {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            },
            201
        ));
    } catch (error: any) {
        logger.error(`Registration error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const { email, password } = value;

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return next(createError('Invalid credentials', 401));
        }

        if (!user.isActive) {
            return next(createError('Account is inactive', 403));
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(createError('Invalid credentials', 401));
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        logger.info(`User logged in: ${user.email}`);

        res.json(successResponse(
            'Login successful',
            {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        ));
    } catch (error: any) {
        logger.error(`Login error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged in user profile
 * @access  Private
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(createError('User not authenticated', 401));
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return next(createError('User not found', 404));
        }

        res.json(successResponse(
            'Profile fetched successfully',
            { user }
        ));
    } catch (error: any) {
        logger.error(`Get profile error: ${error.message}`);
        next(error);
    }
};

