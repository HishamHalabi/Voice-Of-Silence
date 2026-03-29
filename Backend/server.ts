import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './utils/swagger';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import gloveRoutes from './routes/gloveRoutes';
import chatRoutes from './routes/chatRoutes';
import videoRoutes from './routes/videoRoutes';
import deviceRoutes from './routes/deviceRoutes';
import sessionRoutes from './routes/sessionRoutes';

import logger from './utils/logger';
import { errorResponse } from './utils/response';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, 
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        });
    }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(morgan('combined', { stream: logger.stream }));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns server status and timestamp.
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/glove', gloveRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sessions', sessionRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json(errorResponse('Route not found', 404));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(errorResponse(
        err.message || 'Internal server error',
        statusCode,
        process.env.NODE_ENV === 'development' ? err.stack : undefined
    ));
});

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        logger.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    socket.on('join', (userId: string) => {
        socket.join(userId);
        logger.info(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    server.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
});

server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use.`);
    } else {
        logger.error(`Server error: ${error.message}`);
    }
});

process.on('unhandledRejection', (err: any) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close().then(() => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

export { app, io };

