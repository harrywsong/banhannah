// src/routes/index.js
import express from 'express';
import authRoutes from './auth.routes.js';
import coursesRoutes from './courses.routes.js';
import filesRoutes from './files.routes.js';
import reviewsRoutes from './reviews.routes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/files', filesRoutes);
router.use('/reviews', reviewsRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Educational Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      files: '/api/files',
      reviews: '/api/reviews'
    }
  });
});

export default router;