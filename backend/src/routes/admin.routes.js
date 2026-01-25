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
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
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
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
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
    const { page = 1, limit = 20, search, period } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    // Add search filter
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Add period filter
    if (period && period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        where.purchasedAt = { gte: startDate };
      }
    }
    
    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          course: {
            select: { id: true, title: true, type: true, price: true }
          }
        },
        orderBy: { purchasedAt: 'desc' }
      }),
      prisma.purchase.count({ where })
    ]);
    
    // Add status and payment method (mock data for now)
    const purchasesWithStatus = purchases.map(purchase => ({
      ...purchase,
      status: 'completed', // Mock status
      paymentMethod: '카드', // Mock payment method
      originalPrice: purchase.course.price
    }));
    
    res.json({
      purchases: purchasesWithStatus,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get purchase statistics
 */
router.get('/purchases/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [totalRevenue, totalPurchases, monthlyRevenue, monthlyPurchases] = await Promise.all([
      prisma.purchase.aggregate({
        _sum: { amount: true }
      }),
      prisma.purchase.count(),
      prisma.purchase.aggregate({
        where: { purchasedAt: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.purchase.count({
        where: { purchasedAt: { gte: startOfMonth } }
      })
    ]);
    
    const averagePurchase = totalPurchases > 0 ? (totalRevenue._sum.amount || 0) / totalPurchases : 0;
    
    res.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPurchases,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      monthlyPurchases,
      averagePurchase: Math.round(averagePurchase)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Export purchases to CSV
 */
router.get('/purchases/export', async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        },
        course: {
          select: { title: true, type: true }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });
    
    // Create CSV content
    const csvHeader = 'Date,User Name,User Email,Course Title,Course Type,Amount\n';
    const csvRows = purchases.map(purchase => 
      `${purchase.purchasedAt.toISOString().split('T')[0]},${purchase.user.name},${purchase.user.email},"${purchase.course.title}",${purchase.course.type},${purchase.amount}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=purchases.csv');
    res.send(csvContent);
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