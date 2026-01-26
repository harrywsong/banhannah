#!/usr/bin/env node
// Reset admin password script

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log(`📋 Found admin user: ${adminUser.email}`);
    
    // Hash the new password
    const newPassword = 'ChangeThisPassword123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();