// ============================================
// backend/src/middleware/validate.js
// ============================================
import { validationResult } from 'express-validator';

/**
 * Generic validation middleware
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

/**
 * Create validator middleware from rules
 */
export function createValidator(rules) {
  return [...rules, validate];
}