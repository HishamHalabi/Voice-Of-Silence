/**
 * Standard API response helpers
 */

/**
 * Success response
 */
export const successResponse = (message: string, data: any = null, statusCode: number = 200) => {
    const response: any = {
        success: true,
        message,
        status: statusCode, // frontend might use .status or .statusCode
        statusCode
    };

    if (data !== null) {
        response.data = data;
    }

    return response;
};

/**
 * Error response
 */
export const errorResponse = (message: string, statusCode: number = 500, errors: any = null) => {
    const response: any = {
        success: false,
        message,
        statusCode
    };

    if (errors) {
        response.errors = errors;
    }

    return response;
};

/**
 * Paginated response
 */
export const paginatedResponse = (data: any[], page: number, limit: number, total: number) => {
    const totalPages = Math.ceil(total / limit);

    return {
        success: true,
        data,
        pagination: {
            currentPage: page,
            totalPages,
            pageSize: limit,
            totalItems: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

/**
 * Create error object with status code
 */
export interface AppError extends Error {
    statusCode?: number;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    return error;
};
