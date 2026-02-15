/**
 * Error handling utilities and middleware
 */

import log from './logger.js';

/**
 * Custom error classes
 */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

export class ScrapingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ScrapingError';
        this.statusCode = 500;
    }
}

export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

/**
 * Express error handling middleware
 */
export function errorHandler(err, req, res, next) {
    log.error(`${err.name}: ${err.message}`);
    if (process.env.DEBUG === 'true') {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        error: err.message,
        ...(process.env.DEBUG === 'true' && { stack: err.stack })
    });
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Re-export the centralized logger for backwards compatibility
export { log as logger };
