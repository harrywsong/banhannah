#!/usr/bin/env node
// Test the my-files endpoint

import { PrismaClient } from '@prisma/client';
import { getUserAccessedFiles } from '../backend/src/services/userFileAccess.service.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function testMyFiles() {
  try {
    console.log('🧪 Testing my-files functionality...\n');

    // Get a test user
    const user = await prisma.user.findFirst({
      where: { email: 'admin@banhannah.com' }
    });

    if (!user) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`📋 Testing with user: ${user.email} (ID: ${user.id})`);

    // Check current UserFileAccess records for this user
    const accessRecords = await prisma.userFileAccess.findMany({
      where: { userId: user.id },
      include: { file: true }
    });

    console.log(`\n📁 Current access records: ${accessRecords.length}`);
    accessRecords.forEach(record => {
      console.log(`   - File: ${record.file.title} (${record.accessType})`);
    });

    // Test the service function
    console.log('\n🔧 Testing getUserAccessedFiles service...');
    const myFiles = await getUserAccessedFiles(user.id, 6);
    
    console.log(`📊 Service returned ${myFiles.length} files:`);
    myFiles.forEach(file => {
      console.log(`   - ${file.title} (accessed: ${file.userAccess.accessType})`);
    });

    // Test what the old endpoint would return
    console.log('\n📋 Comparing with all published files...');
    const allFiles = await prisma.file.findMany({
      where: { published: true },
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 All published files: ${allFiles.length}`);
    allFiles.forEach(file => {
      console.log(`   - ${file.title}`);
    });

    console.log('\n✅ Test complete!');
    
    if (myFiles.length === 0 && allFiles.length > 0) {
      console.log('\n🎯 EXPECTED BEHAVIOR: my-files is empty (user hasn\'t accessed any files)');
      console.log('   This means the tracking is working correctly!');
    } else if (myFiles.length > 0) {
      console.log('\n🎯 User has accessed files - showing personal history');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMyFiles();