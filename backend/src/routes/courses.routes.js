// src/routes/courses.routes.js
import express from 'express';
import * as coursesController from '../controllers/courses.controller.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { uploadPreview } from '../services/storage.service.js';
import { courseValidation } from '../utils/validators.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, coursesController.getAllCourses);
router.get('/:id', optionalAuth, coursesController.getCourseById);

// Student routes
router.post('/:id/purchase', authenticate, coursesController.purchaseCourse);
router.post('/:id/enroll', authenticate, coursesController.enrollFreeCourse);
router.get('/my/courses', authenticate, coursesController.getMyCourses);
router.put('/:id/progress', authenticate, coursesController.updateProgress);

// Admin routes
router.post('/', 
  authenticate, 
  requireAdmin,
  uploadPreview.single('previewImage'),
  courseValidation,
  coursesController.createCourse
);
router.put('/:id',
  authenticate,
  requireAdmin,
  uploadPreview.single('previewImage'),
  coursesController.updateCourse
);
router.delete('/:id',
  authenticate,
  requireAdmin,
  coursesController.deleteCourse
);

export default router;