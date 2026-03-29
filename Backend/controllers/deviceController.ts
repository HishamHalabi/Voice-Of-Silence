import { Response, NextFunction } from 'express';
import Joi from 'joi';
import Device from '../models/Device';
import { successResponse, createError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

// Validation schemas
const deviceSchema = Joi.object({
    deviceId: Joi.string().required().messages({
        'any.required': 'Hardware Device ID is required'
    }),
    name: Joi.string().min(2).max(80).required().messages({
        'string.min': 'Device name must be at least 2 characters',
        'string.max': 'Device name cannot exceed 80 characters',
        'any.required': 'Device name is required'
    }),
    connectionType: Joi.string().valid('BLE', 'WIFI').default('BLE'),
    firmwareVersion: Joi.string().allow('', null),
    batteryLevel: Joi.number().min(0).max(100).default(100)
});

/**
 * @route   POST /api/devices
 * @desc    Register a new device
 * @access  Private
 */
export const registerDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { error, value } = deviceSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const existingDevice = await Device.findOne({ deviceId: value.deviceId });
        if (existingDevice) {
            return next(createError('Device already registered with this hardware ID', 400));
        }

        const device = await Device.create({
            ...value,
            user: req.user.id
        });

        logger.info(`Device registered: ${device.name} (${device.deviceId}) for user ${req.user.email}`);

        res.status(201).json(successResponse('Device registered successfully', { device }, 201));
    } catch (error: any) {
        logger.error(`Register device error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/devices
 * @desc    Get all user devices
 * @access  Private
 */
export const getMyDevices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const devices = await Device.find({ user: req.user.id, isActive: true });
        res.json(successResponse('Devices fetched successfully', { devices }));
    } catch (error: any) {
        logger.error(`Get devices error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   PUT /api/devices/:id
 * @desc    Update device metadata
 * @access  Private
 */
export const updateDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const updateSchema = Joi.object({
            name: Joi.string().min(2).max(80),
            connectionType: Joi.string().valid('BLE', 'WIFI'),
            firmwareVersion: Joi.string().allow('', null),
            batteryLevel: Joi.number().min(0).max(100),
            isActive: Joi.boolean()
        });

        const { error, value } = updateSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const device = await Device.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { ...value, lastConnected: new Date() },
            { new: true, runValidators: true }
        );

        if (!device) {
            return next(createError('Device not found or not authorized', 404));
        }

        res.json(successResponse('Device updated successfully', { device }));
    } catch (error: any) {
        logger.error(`Update device error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   DELETE /api/devices/:id
 * @desc    Remove/Deactivate device
 * @access  Private
 */
export const deleteDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const device = await Device.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!device) {
            return next(createError('Device not found or not authorized', 404));
        }

        res.json(successResponse('Device deactivated successfully'));
    } catch (error: any) {
        logger.error(`Delete device error: ${error.message}`);
        next(error);
    }
};
