import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import videoService from '../services/videoService';
import Video from '../models/Video';
import path from 'path';
import fs from 'fs';
import { successResponse, createError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * @route   GET /api/videos
 * @desc    Get all videos with filtering
 * @access  Public
 */
export const getAllVideos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const filters = {
            category: req.query.category as string,
            difficulty: req.query.difficulty as string,
            search: req.query.search as string
        };

        const result = await videoService.getVideos(filters, page, limit);

        res.json(successResponse(
            'Videos fetched successfully',
            {
                videos: result.videos,
                pagination: {
                    currentPage: result.page,
                    totalPages: Math.ceil(result.total / result.limit),
                    pageSize: result.limit,
                    totalItems: result.total
                }
            }
        ));
    } catch (error: any) {
        logger.error(`Get videos error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/videos/:id
 * @desc    Get video by ID
 * @access  Public
 */
export const getVideoById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const video = await videoService.getVideoById(req.params.id as string);

        if (!video) {
            return next(createError('Video not found', 404));
        }

        res.json(successResponse('Video fetched successfully', { video }));
    } catch (error: any) {
        logger.error(`Get video error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/videos/stream/:id
 * @desc    Stream video file
 * @access  Public
 */
export const streamVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return next(createError('Video not found', 404));
        }

        const videoPath = video.videoPath;

        if (!fs.existsSync(videoPath)) {
            return next(createError('Video file not found', 404));
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        await video.incrementViews();

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            });

            file.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });

            fs.createReadStream(videoPath).pipe(res);
        }

    } catch (error: any) {
        logger.error(`Stream video error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   POST /api/videos/upload
 * @desc    Upload new video (admin only)
 * @access  Private/Admin
 */
export const uploadVideo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return next(createError('Video file is required', 400));
        }
        if (!req.user) return next(createError('Not authorized', 401));

        const videoData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            difficulty: req.body.difficulty,
            videoPath: req.file.path,
            uploadedBy: req.user.id,
            tags: req.body.tags ? JSON.parse(req.body.tags) : []
        };

        // Validate required fields
        if (!videoData.title || !videoData.description || !videoData.category) {
            return next(createError('Title, description, and category are required', 400));
        }

        const video = await videoService.createVideo(videoData);

        logger.info(`New video uploaded: ${video.title}`);

        res.status(201).json(successResponse(
            'Video uploaded successfully',
            { video },
            201
        ));
    } catch (error: any) {
        logger.error(`Upload video error: ${error.message}`);
        next(error);
    }
};

/**
 * @route   GET /api/videos/stats
 * @desc    Get video statistics
 * @access  Public
 */
export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await videoService.getStatistics();

        res.json(successResponse('Statistics fetched successfully', { stats }));
    } catch (error: any) {
        logger.error(`Get statistics error: ${error.message}`);
        next(error);
    }
};
