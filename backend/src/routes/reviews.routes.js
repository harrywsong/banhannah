// src/routes/reviews.routes.js
import express from 'express';
import * as reviewsController from '../controllers/reviews.controller.js';
import { authenticate } from '../middleware/auth.js';
import { reviewValidation } from '../utils/validators.js';

const router = express.Router();

// Public routes
router.get('/:itemType/:itemId', reviewsController.getReviews);

// Protected routes
router.post('/', authenticate, reviewValidation, reviewsController.createReview);
router.put('/:id', authenticate, reviewsController.updateReview);
router.delete('/:id', authenticate, reviewsController.deleteReview);
router.get('/my/reviews', authenticate, reviewsController.getMyReviews);

export default router;