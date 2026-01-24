// src/controllers/courses.controller.js
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';
import { deleteFile } from '../services/storage.service.js';

/**
 * Get all courses (public)
 */
export async function getAllCourses(req, res, next) {
  try {
    const { type, level, search, featured } = req.query;
    
    const where = { published: true };
    
    if (type) where.type = type;
    if (level) where.level = parseInt(level);
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const courses = await prisma.course.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });
    
    // Calculate average rating
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const reviews = await prisma.review.findMany({
          where: { itemType: 'course', itemId: course.id }
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
}

/**
 * Get course by ID
 */
export async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
    }
    
    // Check if user has purchased (if authenticated)
    let hasPurchased = false;
    if (req.user && course.type === 'paid') {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user.id,
          courseId: course.id
        }
      });
      hasPurchased = !!purchase;
    }
    
    // Increment views
    await prisma.course.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } }
    });
    
    // Calculate average rating
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : 0;
    
    res.json({
      course: {
        ...course,
        averageRating: Math.round(avgRating * 10) / 10,
        hasPurchased
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create course (admin only)
 */
export async function createCourse(req, res, next) {
  try {
    const {
      title,
      description,
      type,
      price,
      discountPrice,
      level,
      duration,
      accessDuration,
      lessons
    } = req.body;
    
    const courseData = {
      title,
      description,
      type,
      level: level ? parseInt(level) : 1,
      duration,
      accessDuration: accessDuration ? parseInt(accessDuration) : 30,
      published: false
    };
    
    if (type === 'paid') {
      courseData.price = parseInt(price);
      if (discountPrice) courseData.discountPrice = parseInt(discountPrice);
    }
    
    if (lessons) {
      courseData.lessons = JSON.parse(lessons);
    }
    
    // Handle preview image
    if (req.file) {
      courseData.previewImage = req.file.filename;
    }
    
    const course = await prisma.course.create({
      data: courseData
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update course (admin only)
 */
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      price,
      discountPrice,
      level,
      duration,
      accessDuration,
      published,
      featured,
      lessons
    } = req.body;
    
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
    }
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (level !== undefined) updateData.level = parseInt(level);
    if (duration !== undefined) updateData.duration = duration;
    if (accessDuration !== undefined) updateData.accessDuration = parseInt(accessDuration);
    if (published !== undefined) updateData.published = published === 'true' || published === true;
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
    
    if (type === 'paid' || course.type === 'paid') {
      if (price !== undefined) updateData.price = parseInt(price);
      if (discountPrice !== undefined) updateData.discountPrice = parseInt(discountPrice);
    }
    
    if (lessons) {
      updateData.lessons = typeof lessons === 'string' ? JSON.parse(lessons) : lessons;
    }
    
    // Handle preview image
    if (req.file) {
      // Delete old image
      if (course.previewImage) {
        deleteFile(course.previewImage, 'previews');
      }
      updateData.previewImage = req.file.filename;
    }
    
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete course (admin only)
 */
export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
    }
    
    // Delete preview image
    if (course.previewImage) {
      deleteFile(course.previewImage, 'previews');
    }
    
    await prisma.course.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Purchase course
 */
export async function purchaseCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
    }
    
    if (course.type !== 'paid') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'This course is free' });
    }
    
    // Check if already purchased
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        courseId: parseInt(id)
      }
    });
    
    if (existingPurchase) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Course already purchased' });
    }
    
    // Create purchase
    const purchase = await prisma.purchase.create({
      data: {
        userId: req.user.id,
        courseId: parseInt(id),
        amount: course.discountPrice || course.price,
        paymentMethod: paymentMethod || '신용카드',
        paymentStatus: 'completed'
      }
    });
    
    // Increment enrollments
    await prisma.course.update({
      where: { id: parseInt(id) },
      data: { enrollments: { increment: 1 } }
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Course purchased successfully',
      purchase
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Enroll in free course
 */
export async function enrollFreeCourse(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
    }
    
    if (course.type !== 'free') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'This course requires purchase' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        courseId: parseInt(id)
      }
    });
    
    if (existingEnrollment) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Already enrolled' });
    }
    
    // Create enrollment (free purchase)
    const enrollment = await prisma.purchase.create({
      data: {
        userId: req.user.id,
        courseId: parseInt(id),
        amount: 0,
        paymentMethod: 'free',
        paymentStatus: 'completed'
      }
    });
    
    // Increment enrollments
    await prisma.course.update({
      where: { id: parseInt(id) },
      data: { enrollments: { increment: 1 } }
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Enrolled successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's purchased/enrolled courses
 */
export async function getMyCourses(req, res, next) {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      include: {
        course: {
          include: {
            _count: {
              select: { reviews: true }
            }
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });
    
    const courses = await Promise.all(
      purchases.map(async (purchase) => {
        const reviews = await prisma.review.findMany({
          where: { itemType: 'course', itemId: purchase.course.id }
        });
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        // Get progress
        const progress = await prisma.progress.findUnique({
          where: {
            userId_courseId: {
              userId: req.user.id,
              courseId: purchase.course.id
            }
          }
        });
        
        return {
          ...purchase.course,
          purchasedAt: purchase.purchasedAt,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          progress: progress?.completedLessons || []
        };
      })
    );
    
    res.json({ courses });
  } catch (error) {
    next(error);
  }
}

/**
 * Update course progress
 */
export async function updateProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { completedLessons } = req.body;
    
    const progress = await prisma.progress.upsert({
      where: {
        userId_courseId: {
          userId: req.user.id,
          courseId: parseInt(id)
        }
      },
      update: {
        completedLessons,
        lastAccessedAt: new Date()
      },
      create: {
        userId: req.user.id,
        courseId: parseInt(id),
        completedLessons
      }
    });
    
    res.json({
      message: 'Progress updated',
      progress
    });
  } catch (error) {
    next(error);
  }
}