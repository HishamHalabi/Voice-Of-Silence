import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { createError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return next(createError('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(createError('User not found', 404));
        }

        if (!user.isActive) {
            return next(createError('User account is inactive', 403));
        }

        req.user = user;

        next();
    } catch (error: any) {
        logger.error(`Auth Error: ${error.message}`);

        if (error.name === 'TokenExpiredError') {
            return next(createError('Token expired, please login again', 401));
        }

        return next(createError('Not authorized to access this route', 401));
    }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(createError(
                `User role '${req.user?.role || 'unknown'}' is not authorized to access this route`,
                403
            ));
        }
        next();
    };
};
