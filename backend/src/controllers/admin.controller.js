// backend/src/controllers/admin.controller.js
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';
import { maskName } from '../utils/helpers.js';

/**
 * Get dashboard statistics (Admin only)
 */
export async function getDashboardStats(req, res, next) {
  try {
    // Overview stats
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalFiles,
      publishedFiles,
      totalPurchases,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.file.count(),
      prisma.file.count({ where: { published: true } }),
      prisma.purchase.count(),
      prisma.purchase.aggregate({ _sum: { amount: true } })
    ]);

    // Growth stats (this week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [newUsersThisWeek, enrollmentsThisWeek] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: oneWeekAgo },
          role: 'STUDENT'
        }
      }),
      prisma.purchase.count({
        where: { purchasedAt: { gte: oneWeekAgo } }
      })
    ]);

    // Top content
    const [topCourses, topFiles] = await Promise.all([
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          views: true,
          _count: { select: { purchases: true } }
        },
        where: { published: true },
        orderBy: { views: 'desc' },
        take: 5
      }),
      prisma.file.findMany({
        select: {
          id: true,
          title: true,
          format: true,
          downloads: true
        },
        where: { published: true },
        orderBy: { downloads: 'desc' },
        take: 5
      })
    ]);

    // Recent purchases
    const recentPurchases = await prisma.purchase.findMany({
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } }
      },
      orderBy: { purchasedAt: 'desc' },
      take: 10
    });

    const stats = {
      overview: {
        totalUsers,
        totalCourses,
        publishedCourses,
        totalFiles,
        publishedFiles,
        totalPurchases,
        totalRevenue: totalRevenue._sum.amount || 0
      },
      growth: {
        newUsersThisWeek,
        enrollmentsThisWeek
      },
      topContent: {
        courses: topCourses.map(course => ({
          id: course.id,
          title: course.title,
          type: course.type,
          views: course.views || 0,
          enrollments: course._count.purchases
        })),
        files: topFiles.map(file => ({
          id: file.id,
          title: file.title,
          format: file.format,
          downloads: file.downloads || 0
        }))
      },
      recentActivity: {
        purchases: recentPurchases
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: offset
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore: parseInt(page) < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
}

/**
 * Get all purchases (Admin only)
 */
export async function getAllPurchases(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', dateFilter = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      if (startDate) {
        where.purchasedAt = { gte: startDate };
      }
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        },
        orderBy: { purchasedAt: 'desc' },
        take: parseInt(limit),
        skip: offset
      }),
      prisma.purchase.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore: parseInt(page) < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    next(error);
  }
}

/**
 * Get purchase statistics (Admin only)
 */
export async function getPurchaseStats(req, res, next) {
  try {
    const [totalRevenue, totalPurchases, averageOrderValue] = await Promise.all([
      prisma.purchase.aggregate({
        _sum: { amount: true }
      }),
      prisma.purchase.count(),
      prisma.purchase.aggregate({
        _avg: { amount: true }
      })
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPurchases,
      averageOrderValue: Math.round(averageOrderValue._avg.amount || 0)
    });
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    next(error);
  }
}

/**
 * Export purchases as CSV (Admin only)
 */
export async function exportPurchases(req, res, next) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            title: true,
            type: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });

    // Create CSV content
    const csvHeader = 'Date,User Name,User Email,Course Title,Course Type,Amount,Payment Method\n';
    const csvRows = purchases.map(purchase => {
      const date = new Date(purchase.purchasedAt).toLocaleDateString('ko-KR');
      const userName = purchase.user?.name || '';
      const userEmail = purchase.user?.email || '';
      const courseTitle = purchase.course?.title || '';
      const courseType = purchase.course?.type || '';
      const amount = purchase.amount || 0;
      const paymentMethod = purchase.paymentMethod || '';
      
      return `"${date}","${userName}","${userEmail}","${courseTitle}","${courseType}","${amount}","${paymentMethod}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="purchases_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csvContent); // Add BOM for proper UTF-8 encoding in Excel
  } catch (error) {
    console.error('Error exporting purchases:', error);
    next(error);
  }
}

/**
 * Get all courses for admin (Admin only)
 */
export async function getAllCoursesAdmin(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', type = '', published = '' } = req.query;
    
    const where = {};
    
    if (type) where.type = type;
    if (published !== '') where.published = published === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.course.count({ where })
    ]);
    
    // Calculate stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const [reviews, purchases] = await Promise.all([
          prisma.review.findMany({
            where: { 
              itemType: 'course', 
              itemId: course.id 
            }
          }),
          prisma.purchase.count({
            where: { courseId: course.id }
          })
        ]);
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        return {
          ...course,
          reviewCount: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10,
          purchaseCount: purchases
        };
      })
    );
    
    res.json({
      courses: coursesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllCoursesAdmin:', error);
    next(error);
  }
}

/**
 * Get all files for admin (Admin only)
 */
export async function getAllFilesAdmin(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', format = '', published = '' } = req.query;
    
    const where = {};
    
    if (format) where.format = format;
    if (published !== '') where.published = published === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.file.count({ where })
    ]);
    
    // Calculate stats for each file
    const filesWithStats = await Promise.all(
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
          reviewCount: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10
        };
      })
    );
    
    res.json({
      files: filesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllFilesAdmin:', error);
    next(error);
  }
}