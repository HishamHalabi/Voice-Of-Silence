import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import GestureData from '../models/GestureData';
import Chat from '../models/Chat';
import gestureService from '../services/gestureService';
import arabicPredictionService from '../services/arabicPredictionService';
import arabicTextService from '../services/arabicTextService';
import sentenceService from '../services/sentenceService';
import ttsService from '../services/ttsService';
import { successResponse, paginatedResponse, createError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

const sensorDataSchema = Joi.object({
    flexSensors: Joi.array()
        .items(Joi.number().required())
        .length(7)
        .required()
        .messages({
            'array.length': 'flexSensors must contain exactly 7 sensor values'
        }),
    timestamp: Joi.number(),
    deviceInfo: Joi.object({
        deviceId: Joi.string(),
        firmwareVersion: Joi.string(),
        batteryLevel: Joi.number().min(0).max(100)
    })
});

const processSensorSchema = Joi.object({
    sensorData: sensorDataSchema.required(),
    isTrainingData: Joi.boolean().default(false),
    actualLetter: Joi.string().length(1).uppercase()
});

/**
 * @route   POST /api/glove/process
 * @desc    Process sensor data and predict letter
 * @access  Private
 */
export const processSensorData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const extendedSchema = processSensorSchema.keys({
            letter: Joi.string().length(1).optional(),
            confidence: Joi.number().min(0).max(1).optional(),
            isFrontendData: Joi.boolean().default(false)
        });

        const { error, value } = extendedSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const { sensorData, isTrainingData, actualLetter, letter, confidence, isFrontendData } = value;

        if (!gestureService.validateSensorData(sensorData)) {
            return next(createError('Invalid sensor data format', 400));
        }

        if (isFrontendData && letter) {
            const gestureRecord = await GestureData.create({
                user: req.user.id,
                sensorData,
                predictedLetter: letter,
                confidence: confidence || 0,
                isTrainingData: isTrainingData === true,
                isFrontendData: true,
                deviceInfo: sensorData.deviceInfo
            });

            return res.json(successResponse('Data saved successfully', {
                saved: true,
                gestureId: gestureRecord._id
            }));
        } else {
            return next(createError('Only frontend prediction data is currently supported', 400));
        }
    } catch (error: any) {
        logger.error(`Process sensor data error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   POST /api/glove/speak
 * @desc    Real-time gesture to speech
 * @access  Private
 */
export const speakRealTime = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const schema = Joi.object({
            text: Joi.string().required(),
            saveToChat: Joi.boolean().default(false),
            action: Joi.string().valid('speakText', 'Text').default('Text')
        });

        const { error, value } = schema.validate(req.body);
        if (error) return next(createError(error.details[0].message, 400));

        const { text, saveToChat } = value;

        if (!text) return res.json(successResponse('No text to speak', { audio: null }));

        let processedText = text;
        try {
            processedText = await sentenceService.processSentence(text, req.user.id);
        } catch (aiError: any) {
            logger.warn(`AI Correction failed: ${aiError.message}`);
            processedText = text;
        }

        const audioResult = await ttsService.textToSpeech(processedText, 'ar');

        if (saveToChat) {
            await Chat.create({
                sender: req.user.id,
                receiver: req.user.id, 
                messageType: 'voice',
                message: processedText,
                isGloveInput: true,
                audioPath: `data:audio/mp3;base64,${audioResult.audioContent}`
            });
        }

        return res.json(successResponse('Speech generated successfully', {
            Text: text,
            correctedText: processedText,
            audio: { base64: audioResult.audioContent, type: 'audio/mp3' }
        }));
    } catch (error: any) {
        logger.error(`Speak real-time error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/glove/history
 * @desc    Get gesture history for user
 * @access  Private
 */
export const getGestureHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const query: any = { user: req.user.id };

        if (req.query.letter) {
            query.predictedLetter = (req.query.letter as string).toUpperCase();
        }

        if (req.query.isTrainingData !== undefined) {
            query.isTrainingData = req.query.isTrainingData === 'true';
        }

        const [gestures, total] = await Promise.all([
            GestureData.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-sensorData'), 
            GestureData.countDocuments(query)
        ]);

        res.json(paginatedResponse(gestures, page, limit, total));
    } catch (error: any) {
        logger.error(`Get gesture history error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   POST /api/glove/calibrate
 * @desc    Calibrate glove (store calibration data)
 * @access  Private
 */
export const calibrateGlove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const { error, value } = sensorDataSchema.validate(req.body);
        if (error) {
            return next(createError(error.details[0].message, 400));
        }

        const calibrationRecord = await GestureData.create({
            user: req.user.id,
            sensorData: value,
            predictedLetter: 'A', 
            confidence: 1.0,
            isTrainingData: true,
            actualLetter: null,
            deviceInfo: value.deviceInfo
        });

        logger.info(`Glove calibrated for user: ${req.user.email}`);

        res.json(successResponse(
            'Glove calibrated successfully',
            { calibrationId: calibrationRecord._id }
        ));
    } catch (error: any) {
        logger.error(`Calibrate glove error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/glove/stats
 * @desc    Get gesture statistics for user
 * @access  Private
 */
export const getStatistics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(createError('Not authorized', 401));

        const stats = await GestureData.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$predictedLetter',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = await GestureData.countDocuments({ user: req.user.id });

        res.json(successResponse(
            'Statistics fetched successfully',
            {
                total,
                byLetter: stats
            }
        ));
    } catch (error: any) {
        logger.error(`Get statistics error: ${error.message}`);
        next(error);
    }
};

