// backend/routes/reviews.js
// Updated to handle itemTitle field

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to mask names
function maskName(name) {
  if (!name) return '';
  const nameParts = name.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    const singleName = nameParts[0];
    if (singleName.length <= 1) return singleName;
    if (singleName.length === 2) return singleName[0] + '*';
    return singleName[0] + '*'.repeat(singleName.length - 2) + singleName[singleName.length - 1];
  } else {
    const firstPart = nameParts[0];
    const lastPart = nameParts[nameParts.length - 1];
    let masked = firstPart.length > 0 ? firstPart[0] + '*'.repeat(Math.max(0, firstPart.length - 1)) : '';
    masked += ' ' + '*'.repeat(Math.max(0, lastPart.length - 1)) + (lastPart.length > 0 ? lastPart[lastPart.length - 1] : '');
    return masked.trim();
  }
}

// Get all reviews (optionally filtered by item)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { itemId, itemType } = req.query;
    
    const where = {};
    if (itemId) where.itemId = parseInt(itemId);
    if (itemType) where.itemType = itemType;
    
    const reviews = await prisma.review.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    const maskedReviews = reviews.map(review => ({
      ...review,
      userName: maskName(review.user.name),
      user: undefined // Remove user object
    }));
    
    res.json({ reviews: maskedReviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Create review
router.post('/', authenticate, reviewValidation, async (req, res) => {
  try {
    const { itemId, itemType, itemTitle, rating, comment } = req.body;  // ✅ Added itemTitle
    
    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        itemId,
        itemType,
        itemTitle,  // ✅ Save itemTitle
        rating,
        comment
      },
      include: { user: { select: { name: true } } }
    });
    
    res.json({ 
      success: true, 
      review: {
        ...review,
        userName: maskName(review.user.name),
        user: undefined
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You have already reviewed this item' });
    }
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { rating, comment, itemTitle } = req.body;  // ✅ Allow updating itemTitle
    
    // Check ownership
    const existing = await prisma.review.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Build update data
    const updateData = { rating, comment };
    if (itemTitle !== undefined) {
      updateData.itemTitle = itemTitle;
    }
    
    const review = await prisma.review.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { user: { select: { name: true } } }
    });
    
    res.json({
      success: true,
      review: {
        ...review,
        userName: maskName(review.user.name),
        user: undefined
      }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.review.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.review.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;