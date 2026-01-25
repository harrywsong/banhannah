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
    
    // Production: check whitelist and Vercel patterns
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    logger.warn(`CORS blocked: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Content-Length']
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
// Global OPTIONS handler for preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Test endpoint for CORS debugging (must be BEFORE main /api routes)
app.get('/api/test-cors', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
});

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