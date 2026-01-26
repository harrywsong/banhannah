// prisma/seed.js - FIXED DATABASE SEEDING
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (accounts only)...');

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

  console.log('\n🎉 Database seeding completed (accounts only)!');
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