// backend/src/controllers/stats.controller.js
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Get platform statistics for homepage
 */
export async function getPlatformStats(req, res, next) {
  try {
    // Get total users (students only)
    const totalUsers = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total courses
    const totalCourses = await prisma.course.count({
      where: { published: true }
    });

    // Get total files
    const totalFiles = await prisma.file.count({
      where: { published: true }
    });

    // Get total purchases (enrollments)
    const totalPurchases = await prisma.purchase.count();

    // Get total reviews
    const totalReviews = await prisma.review.count();

    // Calculate average rating across all reviews
    const avgRatingResult = await prisma.review.aggregate({
      _avg: {
        rating: true
      }
    });

    // Get completion rate (users with progress vs total users with purchases)
    const usersWithProgress = await prisma.progress.count();
    const completionRate = totalPurchases > 0 ? Math.round((usersWithProgress / totalPurchases) * 100) : 0;

    // Calculate total content hours (estimate based on courses and files)
    // For now, we'll estimate: each course = 10 hours, each file = 0.5 hours
    const estimatedHours = (totalCourses * 10) + (totalFiles * 0.5);

    const stats = {
      users: totalUsers,
      courses: totalCourses,
      files: totalFiles,
      purchases: totalPurchases,
      reviews: totalReviews,
      averageRating: avgRatingResult._avg.rating ? Math.round(avgRatingResult._avg.rating * 10) / 10 : 0,
      completionRate,
      contentHours: Math.round(estimatedHours),
      // Calculated metrics for display
      displayStats: {
        students: totalUsers,
        contentHours: Math.round(estimatedHours),
        completionRate: completionRate,
        totalContent: totalCourses + totalFiles,
        satisfaction: avgRatingResult._avg.rating ? Math.round(avgRatingResult._avg.rating * 20) : 85 // Convert 5-star to percentage
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    next(error);
  }
}

/**
 * Get detailed admin statistics
 */
export async function getAdminStats(req, res, next) {
  try {
    // Basic counts
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    const totalCourses = await prisma.course.count();
    const publishedCourses = await prisma.course.count({ where: { published: true } });
    
    const totalFiles = await prisma.file.count();
    const publishedFiles = await prisma.file.count({ where: { published: true } });
    
    const totalPurchases = await prisma.purchase.count();
    const totalReviews = await prisma.review.count();

    // Revenue calculation (sum of all purchase amounts)
    const revenueResult = await prisma.purchase.aggregate({
      _sum: {
        amount: true
      }
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        role: 'STUDENT'
      }
    });

    const recentPurchases = await prisma.purchase.count({
      where: { purchasedAt: { gte: thirtyDaysAgo } }
    });

    const recentReviews = await prisma.review.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Top courses by purchases
    const topCourses = await prisma.course.findMany({
      include: {
        _count: {
          select: { purchases: true }
        }
      },
      orderBy: {
        purchases: { _count: 'desc' }
      },
      take: 5
    });

    const stats = {
      overview: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalCourses,
        publishedCourses,
        totalFiles,
        publishedFiles,
        totalPurchases,
        totalReviews,
        totalRevenue: revenueResult._sum.amount || 0
      },
      recent: {
        newUsers: recentUsers,
        newPurchases: recentPurchases,
        newReviews: recentReviews
      },
      topCourses: topCourses.map(course => ({
        id: course.id,
        title: course.title,
        purchases: course._count.purchases,
        type: course.type,
        price: course.price
      }))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    next(error);
  }
}