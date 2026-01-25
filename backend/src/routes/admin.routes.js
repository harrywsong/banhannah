// backend/src/routes/admin.routes.js - ADD these routes
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as statsService from '../services/stats.service.js';
import { prisma } from '../config/database.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * Get ALL courses (including unpublished) - ADMIN ONLY
 */
router.get('/courses/all', async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    
    // Add ratings
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const reviews = await prisma.review.findMany({
          where: { 
            itemType: 'course', 
            itemId: course.id 
          }
        });
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        return {
          ...course,
          reviewCount: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10
        };
      })
    );
    
    res.json({ courses: coursesWithRatings });
  } catch (error) {
    next(error);
  }
});

/**
 * Get ALL files (including unpublished) - ADMIN ONLY
 */
router.get('/files/all', async (req, res, next) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    
    // Add ratings and URLs
    const filesWithData = await Promise.all(
      files.map(async (file) => {
        const reviews = await prisma.review.findMany({
          where: { 
            itemType: 'file', 
            itemId: file.id 
          }
        });
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        return {
          ...file,
          downloadUrl: `/api/files/download/${file.filename}`,
          previewUrl: file.previewImage ? `/api/files/preview/${file.previewImage}` : null,
          reviewCount: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10
        };
      })
    );
    
    res.json({ files: filesWithData });
  } catch (error) {
    next(error);
  }
});

/**
 * Get dashboard statistics
 */
router.get('/stats/dashboard', async (req, res, next) => {
  try {
    const stats = await statsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * Get revenue statistics
 */
router.get('/stats/revenue', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await statsService.getRevenueStats(start, end);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * Get user statistics
 */
router.get('/stats/users', async (req, res, next) => {
  try {
    const stats = await statsService.getUserStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * Get content statistics
 */
router.get('/stats/content', async (req, res, next) => {
  try {
    const stats = await statsService.getContentStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * Get all users (with pagination)
 */
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              purchases: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user role
 */
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['ADMIN', 'STUDENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    res.json({ message: 'User role updated', user });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete user
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all purchases
 */
router.get('/purchases', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          course: {
            select: { id: true, title: true, type: true }
          }
        },
        orderBy: { purchasedAt: 'desc' }
      }),
      prisma.purchase.count()
    ]);
    
    res.json({
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get system health
 */
router.get('/health', async (req, res, next) => {
  try {
    const dbHealth = await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;