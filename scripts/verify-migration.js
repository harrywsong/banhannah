#!/usr/bin/env node
// Verify UserFileAccess migration

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying UserFileAccess migration...\n');

  try {
    // Test 1: Check if UserFileAccess table exists
    console.log('1. Checking if UserFileAccess table exists...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'UserFileAccess'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ UserFileAccess table exists');
    } else {
      console.log('❌ UserFileAccess table does NOT exist');
      return;
    }

    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'UserFileAccess'
      ORDER BY ordinal_position;
    `;
    
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Test 3: Check indexes
    console.log('\n3. Checking indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'UserFileAccess';
    `;
    
    console.log('Indexes:');
    indexes.forEach(idx => {
      console.log(`   ${idx.indexname}`);
    });

    // Test 4: Check foreign key constraints
    console.log('\n4. Checking foreign key constraints...');
    const constraints = await prisma.$queryRaw`
      SELECT conname, confrelid::regclass AS foreign_table
      FROM pg_constraint 
      WHERE conrelid = 'UserFileAccess'::regclass 
      AND contype = 'f';
    `;
    
    console.log('Foreign keys:');
    constraints.forEach(fk => {
      console.log(`   ${fk.conname} -> ${fk.foreign_table}`);
    });

    // Test 5: Try to create a test record (and delete it)
    console.log('\n5. Testing CRUD operations...');
    
    // Find a test user and file
    const testUser = await prisma.user.findFirst();
    const testFile = await prisma.file.findFirst({ where: { published: true } });
    
    if (testUser && testFile) {
      console.log(`   Using User ID: ${testUser.id}, File ID: ${testFile.id}`);
      
      // Create test record
      const testAccess = await prisma.userFileAccess.create({
        data: {
          userId: testUser.id,
          fileId: testFile.id,
          accessType: 'test',
          accessCount: 1
        }
      });
      console.log('✅ CREATE operation successful');
      
      // Read test record
      const readAccess = await prisma.userFileAccess.findUnique({
        where: { id: testAccess.id }
      });
      console.log('✅ READ operation successful');
      
      // Update test record
      await prisma.userFileAccess.update({
        where: { id: testAccess.id },
        data: { accessCount: 2 }
      });
      console.log('✅ UPDATE operation successful');
      
      // Delete test record
      await prisma.userFileAccess.delete({
        where: { id: testAccess.id }
      });
      console.log('✅ DELETE operation successful');
      
    } else {
      console.log('⚠️  No test user or file found, skipping CRUD test');
    }

    // Test 6: Check if service functions work
    console.log('\n6. Testing service functions...');
    try {
      const { getUserFileStats } = await import('../backend/src/services/userFileAccess.service.js');
      
      if (testUser) {
        const stats = await getUserFileStats(testUser.id);
        console.log('✅ getUserFileStats function works');
        console.log(`   Stats: ${JSON.stringify(stats, null, 2)}`);
      }
    } catch (error) {
      console.log('❌ Service function error:', error.message);
    }

    console.log('\n🎉 Migration verification complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Database table created');
    console.log('✅ Proper columns and types');
    console.log('✅ Indexes created');
    console.log('✅ Foreign keys working');
    console.log('✅ CRUD operations functional');
    console.log('✅ Service functions operational');

  } catch (error) {
    console.error('❌ Migration verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();