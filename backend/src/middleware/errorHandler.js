// src/middleware/errorHandler.js - Global error handler
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
  // Log error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Default error
  let status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';

  // Prisma errors
  if (err.code === 'P2002') {
    status = HTTP_STATUS.CONFLICT;
    message = 'Resource already exists';
  } else if (err.code === 'P2025') {
    status = HTTP_STATUS.NOT_FOUND;
    message = 'Resource not found';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    status = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid or expired token';
  }

  // Send error response
  res.status(status).json({
    error: message,
    ...(ENV.isDev && { stack: err.stack }) // Include stack trace in development
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Route not found'
  });
}