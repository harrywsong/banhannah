// backend/src/routes/index.js - Complete final version
import express from 'express';
import authRoutes from './auth.routes.js';
import coursesRoutes from './courses.routes.js';
import filesRoutes from './files.routes.js';
import reviewsRoutes from './reviews.routes.js';
import videosRoutes from './videos.routes.js';
import adminRoutes from './admin.routes.js';
import statsRoutes from './stats.routes.js';
import contactRoutes from './contact.routes.js';

const router = express.Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/files', filesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/videos', videosRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);
router.use('/contact', contactRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Educational Platform API',
    version: '1.0.0',
    description: 'Full-stack educational platform with courses, files, and video streaming',
    endpoints: {
      auth: {
        path: '/api/auth',
        description: 'Authentication and user management',
        methods: ['POST /register', 'POST /login', 'GET /me', 'PUT /profile']
      },
      courses: {
        path: '/api/courses',
        description: 'Course management and enrollment',
        methods: ['GET /', 'GET /:id', 'POST /:id/purchase', 'POST /:id/enroll']
      },
      files: {
        path: '/api/files',
        description: 'File repository and downloads',
        methods: ['GET /', 'GET /:id', 'GET /download/:filename']
      },
      reviews: {
        path: '/api/reviews',
        description: 'Reviews and ratings',
        methods: ['GET /:itemType/:itemId', 'POST /', 'PUT /:id']
      },
      videos: {
        path: '/api/videos',
        description: 'Video streaming (HLS)',
        methods: ['POST /upload', 'POST /access/:videoId', 'GET /stream/:videoId/index.m3u8']
      },
      admin: {
        path: '/api/admin',
        description: 'Admin-only endpoints',
        methods: [
          'GET /stats/dashboard', 
          'GET /users', 
          'GET /purchases',
          'GET /courses/all',
          'GET /files/all',
          'GET /reviews/all',
          'DELETE /reviews/:id'
        ]
      },
      contact: {
        path: '/api/contact',
        description: 'Contact form submission',
        methods: ['POST /submit']
      }
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: '/api'
  });
});

export default router;