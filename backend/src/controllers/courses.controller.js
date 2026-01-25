// backend/src/controllers/courses.controller.js - FIXED
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
      ]
    });
    
    // Calculate average rating for each course
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
    console.error('Error in getAllCourses:', error);
    next(error);
  }
}

/**
 * Get course by ID
 */
export async function getCourseById(req, res, next) {
  try {
    console.log('📚 Fetching course:', req.params.id);
    const { id } = req.params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      console.log('❌ Invalid course ID:', id);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid course ID' });
    }
    
    console.log('🔍 Looking for course ID:', courseId);
    
    // Fetch course without relations
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      console.log('❌ Course not found:', courseId);
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Course not found' });
    }
    
    console.log('✓ Course found:', course.title);
    
    // Manually fetch reviews for this course
    const reviews = await prisma.review.findMany({
      where: {
        itemType: 'course',
        itemId: courseId
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✓ Found ${reviews.length} reviews`);
    
    // Check if user has purchased (if authenticated)
    let hasPurchased = false;
    if (req.user) {
      console.log('🔐 Checking purchase for user:', req.user.id);
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user.id,
          courseId: courseId
        }
      });
      hasPurchased = !!purchase;
      console.log('Purchase status:', hasPurchased);
    }
    
    // Increment views
    await prisma.course.update({
      where: { id: courseId },
      data: { views: { increment: 1 } }
    });
    
    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    console.log('✓ Sending course data');
    
    res.json({
      course: {
        ...course,
        reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        hasPurchased
      }
    });
  } catch (error) {
    console.error('❌ ERROR in getCourseById:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
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
      courseData.lessons = typeof lessons === 'string' ? JSON.parse(lessons) : lessons;
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
    console.error('Error in createCourse:', error);
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
    console.error('Error in updateCourse:', error);
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
    console.error('Error in deleteCourse:', error);
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
    console.error('Error in purchaseCourse:', error);
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
    console.error('Error in enrollFreeCourse:', error);
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
        course: true
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
    console.error('Error in getMyCourses:', error);
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
    console.error('Error in updateProgress:', error);
    next(error);
  }
}