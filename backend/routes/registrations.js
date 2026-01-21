const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's class registrations
router.get('/', authenticate, async (req, res) => {
  try {
    const registrations = await prisma.classRegistration.findMany({
      where: { userId: req.user.id },
      orderBy: { registeredAt: 'desc' }
    });
    res.json({ registrations });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Failed to get registrations' });
  }
});

// Register for a class
router.post('/', authenticate, async (req, res) => {
  try {
    const { classId } = req.body;
    
    // Check if already registered
    const existing = await prisma.classRegistration.findUnique({
      where: {
        userId_classId: {
          userId: req.user.id,
          classId: classId
        }
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already registered' });
    }
    
    const registration = await prisma.classRegistration.create({
      data: {
        userId: req.user.id,
        classId
      }
    });
    
    // Increment class registered count
    await prisma.liveClass.update({
      where: { id: classId },
      data: { registeredCount: { increment: 1 } }
    });
    
    res.json({ success: true, registration });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Unregister from a class
router.delete('/:classId', authenticate, async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    
    await prisma.classRegistration.delete({
      where: {
        userId_classId: {
          userId: req.user.id,
          classId: classId
        }
      }
    });
    
    // Decrement class registered count
    await prisma.liveClass.update({
      where: { id: classId },
      data: { registeredCount: { decrement: 1 } }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ error: 'Failed to unregister' });
  }
});

// Check if registered for a class
router.get('/check/:classId', authenticate, async (req, res) => {
  try {
    const registration = await prisma.classRegistration.findUnique({
      where: {
        userId_classId: {
          userId: req.user.id,
          classId: parseInt(req.params.classId)
        }
      }
    });
    
    res.json({ registered: !!registration });
  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({ error: 'Failed to check registration' });
  }
});

module.exports = router;