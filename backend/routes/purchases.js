const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's purchases
router.get('/', authenticate, async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      orderBy: { purchasedAt: 'desc' }
    });
    res.json({ purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

// Create purchase
router.post('/', authenticate, async (req, res) => {
  try {
    const { courseId, courseTitle, price, accessDuration, transactionId } = req.body;
    
    // Check if already purchased
    const existing = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        courseId: courseId
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Course already purchased' });
    }
    
    const purchase = await prisma.purchase.create({
      data: {
        userId: req.user.id,
        courseId,
        courseTitle,
        price,
        accessDuration,
        transactionId
      }
    });
    
    res.json({ success: true, purchase });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// Check if user has purchased a course
router.get('/check/:courseId', authenticate, async (req, res) => {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        courseId: parseInt(req.params.courseId)
      }
    });
    
    if (!purchase) {
      return res.json({ purchased: false });
    }
    
    // Check if access expired
    const purchasedAt = new Date(purchase.purchasedAt);
    const accessDuration = purchase.accessDuration || 30;
    const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000);
    const expired = new Date() > expiresAt;
    
    res.json({
      purchased: true,
      expired,
      purchase,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Check purchase error:', error);
    res.status(500).json({ error: 'Failed to check purchase' });
  }
});

module.exports = router;