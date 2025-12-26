import logger from '../utils/logger.js';

/**
 * Central error handler middleware
 * Catches all errors and returns consistent error responses
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message
        });
    }

    if (err.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
            error: 'Conflict',
            message: 'Resource already exists'
        });
    }

    if (err.code === '23503') { // PostgreSQL foreign key violation
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced resource does not exist'
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        error: 'Error',
        message: message
    });
};

export default errorHandler;
