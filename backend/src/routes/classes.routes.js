// ============================================
// backend/src/routes/classes.routes.js
// ============================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Placeholder for future class scheduling features
// This could include:
// - Live class sessions
// - Class schedules
// - Attendance tracking
// - Class recordings

router.get('/', (req, res) => {
  res.json({ message: 'Classes feature coming soon' });
});

export default router;