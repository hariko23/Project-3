const AppError = require('../utils/AppError');

/**
 * Global Error Handling Middleware
 * Handles all errors in the application and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
    // Set default error values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error details
    console.error('Error:', {
        message: err.message,
        statusCode: err.statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method
    });

    // Handle PostgreSQL errors
    if (err.code) {
        // Handle specific PostgreSQL error codes
        switch (err.code) {
            case '23505': // Unique violation
                err.statusCode = 409;
                err.message = 'Duplicate entry. This record already exists.';
                break;
            case '23503': // Foreign key violation
                err.statusCode = 400;
                err.message = 'Invalid reference. Related record does not exist.';
                break;
            case '23502': // Not null violation
                err.statusCode = 400;
                err.message = 'Missing required field.';
                break;
            case '42P01': // Undefined table
                err.statusCode = 500;
                err.message = 'Database table does not exist.';
                break;
            case '42703': // Undefined column
                err.statusCode = 500;
                err.message = 'Database column does not exist.';
                break;
        }
    }

    // Handle validation errors (Joi or similar)
    if (err.isJoi) {
        err.statusCode = 400;
        err.message = err.details.map(detail => detail.message).join(', ');
    }

    // Send error response
    res.status(err.statusCode).json({
        success: false,
        error: err.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(err);
};

module.exports = {
    errorHandler,
    notFoundHandler
};

