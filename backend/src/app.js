// src/app.js - Express application setup
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';

import { ENV } from './config/env.js';
import { configureMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  contentSecurityPolicy: ENV.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = ENV.ALLOWED_ORIGINS.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Development: allow all
    if (ENV.isDev) return callback(null, true);
    
    // Production: check whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    logger.warn(`CORS blocked: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ============================================
// CUSTOM MIDDLEWARE
// ============================================
configureMiddleware(app);

// ============================================
// ROUTES
// ============================================
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;