// prisma/seed.js - Database seeding script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.file.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true
    }
  });

  console.log('✓ Created admin user');

  // Create test students
  const studentPassword = await bcrypt.hash('student123', 10);
  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'student1@example.com',
        name: '김철수',
        password: studentPassword,
        role: 'STUDENT',
        emailVerified: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'student2@example.com',
        name: '이영희',
        password: studentPassword,
        role: 'STUDENT',
        emailVerified: true
      }
    })
  ]);

  console.log('✓ Created test students');

  // Create sample courses
  const courses = await Promise.all([
    // Free course
    prisma.course.create({
      data: {
        title: '웹 개발 기초',
        description: 'HTML, CSS, JavaScript의 기초를 배우는 무료 강의입니다.',
        type: 'free',
        level: 1,
        duration: '4주',
        published: true,
        featured: true,
        lessons: [
          {
            id: 1,
            title: 'HTML 소개',
            description: 'HTML의 기본 구조와 태그를 배웁니다',
            content: [
              { type: 'text', data: 'HTML은 웹 페이지의 구조를 정의합니다.' },
              { type: 'video', data: { videoId: 'intro-html', title: 'HTML 기초' } }
            ]
          },
          {
            id: 2,
            title: 'CSS 스타일링',
            description: '웹 페이지를 아름답게 꾸미는 방법',
            content: [
              { type: 'text', data: 'CSS로 색상, 레이아웃, 애니메이션을 추가합니다.' }
            ]
          },
          {
            id: 3,
            title: 'JavaScript 기초',
            description: '동적인 웹 페이지 만들기',
            content: [
              { type: 'text', data: 'JavaScript로 상호작용을 추가합니다.' }
            ]
          }
        ]
      }
    }),

    // Paid course
    prisma.course.create({
      data: {
        title: 'React 완벽 가이드',
        description: 'React로 현대적인 웹 애플리케이션을 만드는 방법을 배웁니다.',
        type: 'paid',
        price: 99000,
        discountPrice: 79000,
        level: 2,
        duration: '8주',
        accessDuration: 90,
        published: true,
        featured: true,
        lessons: [
          {
            id: 1,
            title: 'React 시작하기',
            description: 'React의 기본 개념과 설정',
            content: [
              { type: 'text', data: 'React는 컴포넌트 기반 UI 라이브러리입니다.' }
            ]
          },
          {
            id: 2,
            title: 'JSX와 컴포넌트',
            description: 'JSX 문법과 컴포넌트 작성법',
            content: [
              { type: 'text', data: 'JSX는 JavaScript XML의 약자입니다.' }
            ]
          },
          {
            id: 3,
            title: 'State와 Props',
            description: '데이터 관리의 기초',
            content: [
              { type: 'text', data: 'State는 컴포넌트의 동적 데이터를 관리합니다.' }
            ]
          }
        ]
      }
    }),

    prisma.course.create({
      data: {
        title: 'Node.js 백엔드 개발',
        description: 'Express와 MongoDB를 활용한 RESTful API 개발',
        type: 'paid',
        price: 129000,
        level: 2,
        duration: '10주',
        published: true,
        lessons: [
          {
            id: 1,
            title: 'Node.js 소개',
            description: 'Node.js의 특징과 설치',
            content: []
          },
          {
            id: 2,
            title: 'Express 프레임워크',
            description: 'Express로 서버 구축하기',
            content: []
          }
        ]
      }
    }),

    prisma.course.create({
      data: {
        title: 'Python 프로그래밍',
        description: '프로그래밍 입문자를 위한 Python 기초 강의',
        type: 'free',
        level: 1,
        duration: '6주',
        published: true,
        lessons: [
          {
            id: 1,
            title: 'Python 설치와 환경 설정',
            description: 'Python 개발 환경 구축',
            content: []
          },
          {
            id: 2,
            title: '변수와 자료형',
            description: 'Python의 기본 자료형',
            content: []
          }
        ]
      }
    })
  ]);

  console.log('✓ Created sample courses');

  // Create sample files
  const files = await Promise.all([
    prisma.file.create({
      data: {
        title: 'JavaScript 치트시트',
        description: 'JavaScript의 핵심 문법을 정리한 PDF',
        filename: 'js-cheatsheet.pdf',
        originalName: 'JavaScript Cheatsheet.pdf',
        fileSize: 1024000,
        format: 'PDF',
        level: 1,
        published: true,
        featured: true
      }
    }),
    prisma.file.create({
      data: {
        title: 'React Hooks 가이드',
        description: 'React Hooks 완벽 가이드 문서',
        filename: 'react-hooks.pdf',
        originalName: 'React Hooks Guide.pdf',
        fileSize: 2048000,
        format: 'PDF',
        level: 2,
        published: true
      }
    }),
    prisma.file.create({
      data: {
        title: '알고리즘 문제 모음',
        description: '코딩 테스트 대비 알고리즘 문제집',
        filename: 'algorithms.zip',
        originalName: 'Algorithms.zip',
        fileSize: 5120000,
        format: 'ZIP',
        level: 3,
        published: true
      }
    })
  ]);

  console.log('✓ Created sample files');

  // Create sample purchases
  await prisma.purchase.create({
    data: {
      userId: students[0].id,
      courseId: courses[0].id,
      amount: 0,
      paymentMethod: 'free'
    }
  });

  await prisma.purchase.create({
    data: {
      userId: students[0].id,
      courseId: courses[1].id,
      amount: 79000,
      paymentMethod: '신용카드'
    }
  });

  console.log('✓ Created sample purchases');

  // Create sample reviews - Fixed to handle foreign key constraints properly
  // Create course reviews
  await prisma.review.create({
    data: {
      userId: students[0].id,
      itemType: 'course',
      itemId: courses[0].id,
      rating: 5,
      comment: '정말 좋은 강의입니다! 초보자도 쉽게 따라할 수 있어요.'
    }
  });

  await prisma.review.create({
    data: {
      userId: students[1].id,
      itemType: 'course',
      itemId: courses[0].id,
      rating: 4,
      comment: '유익한 내용이 많았습니다. 추천합니다!'
    }
  });

  // Create file review
  await prisma.review.create({
    data: {
      userId: students[0].id,
      itemType: 'file',
      itemId: files[0].id,
      rating: 5,
      comment: '필요한 내용이 잘 정리되어 있어서 좋습니다.'
    }
  });

  console.log('✓ Created sample reviews');

  // Update course stats
  await prisma.course.updateMany({
    data: { views: Math.floor(Math.random() * 1000) + 100 }
  });

  await prisma.file.updateMany({
    data: { downloads: Math.floor(Math.random() * 500) + 50 }
  });

  console.log('✓ Updated stats');

  console.log('\n🎉 Database seeding completed!');
  console.log('\nTest Accounts:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Student 1: student1@example.com / student123');
  console.log('Student 2: student2@example.com / student123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });