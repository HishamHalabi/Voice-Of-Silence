import { Request } from 'express';
import { IUser } from './models/User';

export interface AuthenticatedRequest extends Request {
    user?: IUser;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
