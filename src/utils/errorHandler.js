/**
 * Error handling utilities and middleware
 */

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
    // Log error
    console.error('❌ Error:', err.message);
    if (process.env.DEBUG === 'true') {
        console.error(err.stack);
    }
    
    // Determine status code
    const statusCode = err.statusCode || 500;
    
    // Send error response
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

/**
 * Logger utility
 */
export const logger = {
    info: (message, ...args) => {
        console.log(`ℹ️  ${message}`, ...args);
    },
    
    success: (message, ...args) => {
        console.log(`✅ ${message}`, ...args);
    },
    
    warn: (message, ...args) => {
        console.warn(`⚠️  ${message}`, ...args);
    },
    
    error: (message, ...args) => {
        console.error(`❌ ${message}`, ...args);
    },
    
    debug: (message, ...args) => {
        if (process.env.DEBUG === 'true') {
            console.log(`🔍 ${message}`, ...args);
        }
    }
};
