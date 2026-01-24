// src/routes/auth.routes.js
import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { 
  registerValidation, 
  loginValidation 
} from '../utils/validators.js';
import { body, validate } from '../utils/validators.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', 
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    validate
  ],
  authController.resendVerification
);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', 
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    validate
  ],
  authController.updateProfile
);
router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate
  ],
  authController.changePassword
);

export default router;