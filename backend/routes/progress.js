const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get course progress
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const progress = await prisma.courseProgress.findMany({
      where: {
        userId: req.user.id,
        courseId: parseInt(req.params.courseId)
      }
    });
    
    // Convert to object format for frontend
    const progressObj = {};
    progress.forEach(p => {
      progressObj[p.lessonId] = {
        completed: p.completed,
        completedAt: p.completedAt
      };
    });
    
    res.json({ progress: progressObj });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Mark lesson complete
router.post('/lesson', authenticate, async (req, res) => {
  try {
    const { courseId, lessonId, completed } = req.body;
    
    const progress = await prisma.courseProgress.upsert({
      where: {
        userId_courseId_lessonId: {
          userId: req.user.id,
          courseId: parseInt(courseId),
          lessonId: parseInt(lessonId)
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null
      },
      create: {
        userId: req.user.id,
        courseId: parseInt(courseId),
        lessonId: parseInt(lessonId),
        completed,
        completedAt: completed ? new Date() : null
      }
    });
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;