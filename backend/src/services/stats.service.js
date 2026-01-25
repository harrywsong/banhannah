// backend/src/services/stats.service.js
import { prisma } from '../config/database.js';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const [
    totalUsers,
    totalCourses,
    totalFiles,
    publishedCourses,
    publishedFiles,
    totalPurchases,
    recentPurchases,
    topCourses,
    topFiles
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.file.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.file.count({ where: { published: true } }),
    prisma.purchase.count(),
    prisma.purchase.findMany({
      take: 10,
      orderBy: { purchasedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } }
      }
    }),
    prisma.course.findMany({
      take: 5,
      orderBy: { enrollments: 'desc' },
      select: {
        id: true,
        title: true,
        enrollments: true,
        views: true,
        type: true,
        published: true
      }
    }),
    prisma.file.findMany({
      take: 5,
      orderBy: { downloads: 'desc' },
      select: {
        id: true,
        title: true,
        downloads: true,
        format: true,
        published: true
      }
    })
  ]);

  const purchases = await prisma.purchase.findMany({
    select: { amount: true }
  });
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  });

  const recentEnrollments = await prisma.purchase.count({
    where: { purchasedAt: { gte: sevenDaysAgo } }
  });

  return {
    overview: {
      totalUsers,
      totalCourses,
      totalFiles,
      totalRevenue,
      publishedCourses,
      publishedFiles,
      totalPurchases
    },
    growth: {
      newUsersThisWeek: newUsers,
      enrollmentsThisWeek: recentEnrollments
    },
    topContent: {
      courses: topCourses,
      files: topFiles
    },
    recentActivity: {
      purchases: recentPurchases
    }
  };
}

export async function getRevenueStats() {
  return { totalRevenue: 0, dailyRevenue: [] };
}

export async function getUserStats() {
  return { overview: {}, growth: {} };
}

export async function getContentStats() {
  return { courses: {}, files: {}, reviews: {} };
}