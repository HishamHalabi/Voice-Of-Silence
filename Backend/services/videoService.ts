import Video, { IVideo } from '../models/Video';
import path from 'path';
import fs from 'fs';
const fsPromises = fs.promises;
import logger from '../utils/logger';

interface VideoFilters {
    category?: string;
    difficulty?: string;
    search?: string;
}

interface VideoListResponse {
    videos: IVideo[];
    total: number;
    page: number;
    limit: number;
}

class VideoService {
    /**
     * Get videos with filtering and pagination
     * @param {VideoFilters} filters - Filter criteria
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<VideoListResponse>} Videos and pagination info
     */
    async getVideos({ category, difficulty, search }: VideoFilters, page: number = 1, limit: number = 10): Promise<VideoListResponse> {
        try {
            const query: any = { isPublished: true };

            // Apply filters
            if (category) {
                query.category = category;
            }

            if (difficulty) {
                query.difficulty = difficulty;
            }

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            const skip = (page - 1) * limit;

            const [videos, total] = await Promise.all([
                Video.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('-__v')
                    .populate('uploadedBy', 'name email'),
                Video.countDocuments(query)
            ]);

            return {
                videos: videos as IVideo[],
                total,
                page,
                limit
            };
        } catch (error: any) {
            logger.error(`Error fetching videos: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get video by ID
     * @param {string} videoId - Video ID
     * @returns {Promise<IVideo | null>} Video document
     */
    async getVideoById(videoId: string): Promise<IVideo | null> {
        try {
            const video = await Video.findById(videoId)
                .populate('uploadedBy', 'name email');

            return video;
        } catch (error: any) {
            logger.error(`Error fetching video: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create new video
     * @param {any} videoData - Video metadata
     * @returns {Promise<IVideo>} Created video document
     */
    async createVideo(videoData: any): Promise<IVideo> {
        try {
            const video = new Video(videoData);
            await video.save();

            logger.info(`New video created: ${video.title}`);

            return video;
        } catch (error: any) {
            logger.error(`Error creating video: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update video
     * @param {string} videoId - Video ID
     * @param {any} updateData - Data to update
     * @returns {Promise<IVideo | null>} Updated video document
     */
    async updateVideo(videoId: string, updateData: any): Promise<IVideo | null> {
        try {
            const video = await Video.findByIdAndUpdate(
                videoId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!video) {
                throw new Error('Video not found');
            }

            logger.info(`Video updated: ${video.title}`);

            return video;
        } catch (error: any) {
            logger.error(`Error updating video: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete video
     * @param {string} videoId - Video ID
     */
    async deleteVideo(videoId: string): Promise<void> {
        try {
            const video = await Video.findById(videoId);

            if (!video) {
                throw new Error('Video not found');
            }

            // Delete video file
            if (video.videoPath) {
                try {
                    await fsPromises.unlink(video.videoPath);
                } catch (err: any) {
                    logger.warn(`Failed to delete video file: ${err.message}`);
                }
            }

            // Delete thumbnail if exists
            if (video.thumbnailPath) {
                try {
                    await fsPromises.unlink(video.thumbnailPath);
                } catch (err: any) {
                    logger.warn(`Failed to delete thumbnail: ${err.message}`);
                }
            }

            await video.deleteOne();

            logger.info(`Video deleted: ${video.title}`);
        } catch (error: any) {
            logger.error(`Error deleting video: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get video statistics
     * @returns {Promise<any>} Video statistics
     */
    async getStatistics(): Promise<any> {
        try {
            const [total, byCategory, byDifficulty, topViewed] = await Promise.all([
                Video.countDocuments({ isPublished: true }),
                Video.aggregate([
                    { $match: { isPublished: true } },
                    { $group: { _id: '$category', count: { $sum: 1 } } }
                ]),
                Video.aggregate([
                    { $match: { isPublished: true } },
                    { $group: { _id: '$difficulty', count: { $sum: 1 } } }
                ]),
                Video.find({ isPublished: true })
                    .sort({ viewCount: -1 })
                    .limit(5)
                    .select('title viewCount category')
            ]);

            return {
                total,
                byCategory,
                byDifficulty,
                topViewed
            };
        } catch (error: any) {
            logger.error(`Error fetching video statistics: ${error.message}`);
            throw error;
        }
    }
}

export default new VideoService();
