// backend/src/routes/admin.routes.js
import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as coursesController from '../controllers/courses.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Purchase management
router.get('/purchases', adminController.getAllPurchases);
router.get('/purchases/stats', adminController.getPurchaseStats);
router.get('/purchases/export', adminController.exportPurchases);

// Course management (admin can see all courses, not just published)
router.get('/courses/all', adminController.getAllCoursesAdmin);

// File management
router.get('/files/all', adminController.getAllFilesAdmin);

// Review management
router.get('/reviews/all', adminController.getAllReviewsAdmin);
router.delete('/reviews/:id', adminController.deleteReview);

export default router;