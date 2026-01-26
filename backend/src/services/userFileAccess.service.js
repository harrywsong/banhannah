// backend/src/services/userFileAccess.service.js
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Track user file access (download, view, preview)
 */
export async function trackFileAccess(userId, fileId, accessType = 'download') {
  try {
    // Check if user has accessed this file before
    const existingAccess = await prisma.userFileAccess.findUnique({
      where: {
        userId_fileId: {
          userId: parseInt(userId),
          fileId: parseInt(fileId)
        }
      }
    });

    if (existingAccess) {
      // Update existing access record
      await prisma.userFileAccess.update({
        where: { id: existingAccess.id },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 },
          // Update access type if it's more significant (download > view > preview)
          accessType: getHigherAccessType(existingAccess.accessType, accessType)
        }
      });
      
      logger.info(`📁 Updated file access: User ${userId} -> File ${fileId} (${accessType})`);
    } else {
      // Create new access record
      await prisma.userFileAccess.create({
        data: {
          userId: parseInt(userId),
          fileId: parseInt(fileId),
          accessType,
          firstAccessedAt: new Date(),
          lastAccessedAt: new Date(),
          accessCount: 1
        }
      });
      
      logger.info(`📁 New file access: User ${userId} -> File ${fileId} (${accessType})`);
    }

    return true;
  } catch (error) {
    logger.error('Error tracking file access:', error);
    return false;
  }
}

/**
 * Get user's accessed files (for "내 파일" section)
 */
export async function getUserAccessedFiles(userId, limit = 10, offset = 0) {
  try {
    const userFiles = await prisma.userFileAccess.findMany({
      where: { userId: parseInt(userId) },
      include: {
        file: {
          include: {
            _count: {
              select: { userAccess: true }
            }
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Filter out files that are no longer published and add additional data
    const accessedFiles = await Promise.all(
      userFiles
        .filter(access => access.file && access.file.published) // Filter published files here
        .map(async (access) => {
          const file = access.file;
          
          // Get reviews for this file
          const reviews = await prisma.review.findMany({
            where: { itemType: 'file', itemId: file.id }
          });
          
          const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

          return {
            ...file,
            userAccess: {
              accessType: access.accessType,
              firstAccessedAt: access.firstAccessedAt,
              lastAccessedAt: access.lastAccessedAt,
              accessCount: access.accessCount
            },
            reviewCount: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10,
            totalUserAccess: file._count.userAccess
          };
        })
    );

    return accessedFiles;
  } catch (error) {
    logger.error('Error getting user accessed files:', error);
    return [];
  }
}

/**
 * Get user file access statistics
 */
export async function getUserFileStats(userId) {
  try {
    const [totalAccessed, totalDownloads, recentAccess] = await Promise.all([
      // Total unique files accessed
      prisma.userFileAccess.count({
        where: { userId: parseInt(userId) }
      }),
      
      // Total download actions
      prisma.userFileAccess.aggregate({
        where: { 
          userId: parseInt(userId),
          accessType: 'download'
        },
        _sum: { accessCount: true }
      }),
      
      // Recent file access
      prisma.userFileAccess.findMany({
        where: { userId: parseInt(userId) },
        include: {
          file: {
            select: {
              id: true,
              title: true,
              format: true,
              published: true
            }
          }
        },
        orderBy: { lastAccessedAt: 'desc' },
        take: 5
      })
    ]);

    return {
      totalFilesAccessed: totalAccessed,
      totalDownloads: totalDownloads._sum.accessCount || 0,
      recentFiles: recentAccess
        .filter(access => access.file?.published)
        .map(access => ({
          ...access.file,
          lastAccessedAt: access.lastAccessedAt,
          accessType: access.accessType
        }))
    };
  } catch (error) {
    logger.error('Error getting user file stats:', error);
    return {
      totalFilesAccessed: 0,
      totalDownloads: 0,
      recentFiles: []
    };
  }
}

/**
 * Check if user has accessed a specific file
 */
export async function hasUserAccessedFile(userId, fileId) {
  try {
    const access = await prisma.userFileAccess.findUnique({
      where: {
        userId_fileId: {
          userId: parseInt(userId),
          fileId: parseInt(fileId)
        }
      }
    });
    
    return !!access;
  } catch (error) {
    logger.error('Error checking user file access:', error);
    return false;
  }
}

/**
 * Helper function to determine higher access type priority
 */
function getHigherAccessType(current, newType) {
  const priority = {
    'preview': 1,
    'view': 2,
    'download': 3
  };
  
  return priority[newType] > priority[current] ? newType : current;
}

/**
 * Get popular files based on user access
 */
export async function getPopularFiles(limit = 10) {
  try {
    const popularFiles = await prisma.file.findMany({
      where: { published: true },
      include: {
        _count: {
          select: { userAccess: true }
        }
      },
      orderBy: [
        { userAccess: { _count: 'desc' } },
        { downloads: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return popularFiles.map(file => ({
      ...file,
      accessCount: file._count.userAccess
    }));
  } catch (error) {
    logger.error('Error getting popular files:', error);
    return [];
  }
}