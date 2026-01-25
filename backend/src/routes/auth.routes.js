import express from 'express';
import { body, validationResult } from 'express-validator';  // ✅ Add this
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { 
  registerValidation, 
  loginValidation 
} from '../utils/validators.js';

const validate = (req, res, next) => {  // ✅ Add this
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

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

// User data endpoints
router.get('/my-purchases', authenticate, authController.getMyPurchases);
router.get('/my-progress', authenticate, authController.getMyProgress);

export default router;