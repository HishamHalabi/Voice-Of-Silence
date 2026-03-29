import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from '../utils/response';

// Create upload directories if they don't exist
const uploadDirs = [
    './public/audio/chat',
    './public/audio/tts',
    './uploads/videos'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for audio files (chat voice messages)
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/audio/chat');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Storage configuration for video files
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/videos');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter for audio files
const audioFileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /mp3|wav|ogg|m4a|aac|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(createError('Only audio files are allowed (mp3, wav, ogg, m4a, aac, webm)', 400));
    }
};

// File filter for video files
const videoFileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(createError('Only video files are allowed', 400));
    }
};

// Audio upload middleware
export const uploadAudio = multer({
    storage: audioStorage,
    limits: {
        fileSize: (parseInt(process.env.MAX_AUDIO_SIZE_MB || '10')) * 1024 * 1024 // Default 10MB
    },
    fileFilter: audioFileFilter
});

// Video upload middleware
export const uploadVideo = multer({
    storage: videoStorage,
    limits: {
        fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '50')) * 1024 * 1024 // Default 50MB
    },
    fileFilter: videoFileFilter
});
