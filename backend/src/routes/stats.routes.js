// backend/src/routes/stats.routes.js
import express from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public stats for homepage (no authentication required)
router.get('/public', statsController.getPublicStats);

// Public stats for homepage (legacy endpoint)
router.get('/platform', statsController.getPlatformStats);

// Admin-only detailed stats
router.get('/admin', authenticate, requireAdmin, statsController.getAdminStats);

export default router;