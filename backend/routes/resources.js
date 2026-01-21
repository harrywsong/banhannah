const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's accessed resources
router.get('/accessed', authenticate, async (req, res) => {
  try {
    const resources = await prisma.resourceAccess.findMany({
      where: { userId: req.user.id },
      orderBy: { accessedAt: 'desc' }
    });
    res.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to get resources' });
  }
});

// Record resource access
router.post('/access', authenticate, async (req, res) => {
  try {
    const { resourceId, resourceType, purchased } = req.body;
    
    const access = await prisma.resourceAccess.create({
      data: {
        userId: req.user.id,
        resourceId: parseInt(resourceId),
        resourceType,
        purchased: purchased || false
      }
    });
    
    res.json({ success: true, access });
  } catch (error) {
    console.error('Record access error:', error);
    res.status(500).json({ error: 'Failed to record access' });
  }
});

module.exports = router;