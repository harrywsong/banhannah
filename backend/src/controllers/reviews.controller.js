// src/controllers/reviews.controller.js
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';
import { maskName } from '../utils/helpers.js';

/**
 * Get all reviews (for homepage carousel and reviews page)
 */
export async function getAllReviews(req, res, next) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    // Fetch item details for each review
    const reviewsWithItems = await Promise.all(
      reviews.map(async (review) => {
        let itemDetails = null;
        
        if (review.itemType === 'course') {
          const course = await prisma.course.findUnique({
            where: { id: review.itemId },
            select: { id: true, title: true }
          });
          if (course) {
            itemDetails = {
              title: course.title,
              link: `/courses/${course.id}`
            };
          }
        } else if (review.itemType === 'file') {
          const file = await prisma.file.findUnique({
            where: { id: review.itemId },
            select: { id: true, title: true }
          });
          if (file) {
            itemDetails = {
              title: file.title,
              link: `/files?search=${encodeURIComponent(file.title)}`
            };
          }
        }
        
        return {
          ...review,
          itemDetails,
          user: {
            ...review.user,
            name: maskName(review.user.name)
          }
        };
      })
    );
    
    // Get total count for pagination
    const totalCount = await prisma.review.count();
    
    res.json({ 
      reviews: reviewsWithItems,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reviews for an item
 */
export async function getReviews(req, res, next) {
  try {
    const { itemType, itemId } = req.params;
    
    const reviews = await prisma.review.findMany({
      where: {
        itemType,
        itemId: parseInt(itemId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch item details for each review
    const reviewsWithItems = await Promise.all(
      reviews.map(async (review) => {
        let itemDetails = null;
        
        if (review.itemType === 'course') {
          const course = await prisma.course.findUnique({
            where: { id: review.itemId },
            select: { id: true, title: true }
          });
          if (course) {
            itemDetails = {
              title: course.title,
              link: `/courses/${course.id}`
            };
          }
        } else if (review.itemType === 'file') {
          const file = await prisma.file.findUnique({
            where: { id: review.itemId },
            select: { id: true, title: true }
          });
          if (file) {
            itemDetails = {
              title: file.title,
              link: `/files?search=${encodeURIComponent(file.title)}`
            };
          }
        }
        
        return {
          ...review,
          itemDetails,
          user: {
            ...review.user,
            name: maskName(review.user.name)
          }
        };
      })
    );
    
    res.json({ reviews: reviewsWithItems });
  } catch (error) {
    next(error);
  }
}

/**
 * Create review
 */
export async function createReview(req, res, next) {
  try {
    const { rating, comment, itemId, itemType } = req.body;
    
    // Check if item exists
    if (itemType === 'course') {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(itemId) }
      });
      if (!course) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
      }
      
      // Check if user has purchased the course
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user.id,
          courseId: parseInt(itemId)
        }
      });
      if (!purchase) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ 
          error: 'You must purchase this course before reviewing' 
        });
      }
    } else if (itemType === 'file') {
      const file = await prisma.file.findUnique({
        where: { id: parseInt(itemId) }
      });
      if (!file) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
      }
    }
    
    // Check if user already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: req.user.id,
        itemType,
        itemId: parseInt(itemId)
      }
    });
    
    if (existingReview) {
      return res.status(HTTP_STATUS.CONFLICT).json({ 
        error: 'You have already reviewed this item' 
      });
    }
    
    // Create review
    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        itemType,
        itemId: parseInt(itemId),
        rating: parseInt(rating),
        comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Review created successfully',
      review: {
        ...review,
        user: {
          ...review.user,
          name: maskName(review.user.name)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update review
 */
export async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Review not found' });
    }
    
    // Check ownership
    if (review.userId !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        error: 'You can only update your own reviews' 
      });
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: parseInt(id) },
      data: {
        rating: rating ? parseInt(rating) : review.rating,
        comment: comment || review.comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json({
      message: 'Review updated successfully',
      review: {
        ...updatedReview,
        user: {
          ...updatedReview.user,
          name: maskName(updatedReview.user.name)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete review (Admin only)
 */
export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Review not found' });
    }
    
    // Only admins can delete reviews
    if (req.user.role !== 'ADMIN') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        error: 'Only administrators can delete reviews' 
      });
    }
    
    await prisma.review.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's reviews
 */
export async function getMyReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
}