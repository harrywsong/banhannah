// src/middleware/security.js - Security middleware
import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Rate limiting configuration
 */
const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ENV.isDev, // Skip in development
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${req.ip}`);
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
  });
};

// Different rate limiters for different routes
export const generalLimiter = createRateLimiter(15 * 60 * 1000, 500); // 500 requests per 15 minutes
export const authLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes
export const uploadLimiter = createRateLimiter(60 * 60 * 1000, 20); // 20 uploads per hour

/**
 * Configure all security middleware
 */
export function configureMiddleware(app) {
  // Apply general rate limiter
  if (ENV.isProd) {
    app.use('/api/', generalLimiter);
    logger.info('✓ Rate limiting enabled');
  }
  
  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}