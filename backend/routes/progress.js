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
      progressObj[p.lessonId] = {  // ✅ lessonId is now a string
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
    
    console.log('📝 Progress update request:', {
      userId: req.user.id,
      courseId,
      lessonId,
      completed
    });
    
    const progress = await prisma.courseProgress.upsert({
      where: {
        userId_courseId_lessonId: {
          userId: req.user.id,
          courseId: parseInt(courseId),
          lessonId: String(lessonId)  // ✅ Store as string
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null
      },
      create: {
        userId: req.user.id,
        courseId: parseInt(courseId),
        lessonId: String(lessonId),  // ✅ Store as string
        completed,
        completedAt: completed ? new Date() : null
      }
    });
    
    console.log('✅ Progress updated successfully');
    res.json({ success: true, progress });
  } catch (error) {
    console.error('❌ Update progress error:', error);
    res.status(500).json({ 
      error: 'Failed to update progress',
      details: error.message 
    });
  }
});

module.exports = router;