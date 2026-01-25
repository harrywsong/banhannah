// backend/test-course.js - Check what's wrong with course #4
import { prisma } from './src/config/database.js';

async function testCourse() {
  console.log('🔍 Testing Course #4...\n');

  try {
    // Check all courses
    const allCourses = await prisma.course.findMany();
    console.log(`Total courses in database: ${allCourses.length}`);
    
    if (allCourses.length === 0) {
      console.log('\n❌ NO COURSES FOUND!');
      console.log('Run: npm run prisma:seed');
      await prisma.$disconnect();
      return;
    }

    console.log('\nCourses:');
    allCourses.forEach(c => {
      console.log(`  ${c.id}: ${c.title} (${c.type})`);
    });

    // Try to fetch course #4
    console.log('\n🔍 Fetching Course #4...');
    const course4 = await prisma.course.findUnique({
      where: { id: 4 }
    });

    if (!course4) {
      console.log('❌ Course #4 does not exist');
      console.log('\nAvailable course IDs:', allCourses.map(c => c.id).join(', '));
    } else {
      console.log('✓ Course #4 found:', course4.title);
      
      // Try with reviews
      console.log('\n🔍 Fetching with reviews...');
      const courseWithReviews = await prisma.course.findUnique({
        where: { id: 4 },
        include: {
          reviews: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
      
      console.log('✓ Successfully fetched with reviews');
      console.log(`  Reviews: ${courseWithReviews.reviews.length}`);
    }

    // Check for broken reviews
    console.log('\n🔍 Checking for orphaned reviews...');
    const allReviews = await prisma.review.findMany({
      where: { itemType: 'course' }
    });
    
    console.log(`Total course reviews: ${allReviews.length}`);
    
    for (const review of allReviews) {
      const courseExists = await prisma.course.findUnique({
        where: { id: review.itemId }
      });
      
      if (!courseExists) {
        console.log(`⚠️  Orphaned review #${review.id} points to non-existent course #${review.itemId}`);
      }
      
      const userExists = await prisma.user.findUnique({
        where: { id: review.userId }
      });
      
      if (!userExists) {
        console.log(`⚠️  Review #${review.id} points to non-existent user #${review.userId}`);
      }
    }

    console.log('\n✅ Test complete');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Code:', error.code);
    console.error('\nFull error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testCourse();