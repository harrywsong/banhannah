#!/usr/bin/env node
// ============================================
// Deployment Verification Script
// ============================================
// Verifies that the backend is properly set up

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.join(__dirname, '..', 'backend');

console.log('🔍 Verifying Oracle Cloud deployment setup...\n');

let allGood = true;

// Check functions
const checkExists = (filePath, description) => {
  const fullPath = path.join(backendDir, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - NOT FOUND`);
    allGood = false;
    return false;
  }
};

const checkDirectory = (dirPath, description) => {
  const fullPath = path.join(backendDir, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`✅ ${description}: ${dirPath}/`);
    return true;
  } else {
    console.log(`❌ ${description}: ${dirPath}/ - NOT FOUND`);
    allGood = false;
    return false;
  }
};

// 1. Check essential files
console.log('📁 Checking essential files:');
checkExists('package.json', 'Package configuration');
checkExists('server.js', 'Main server file');
checkExists('prisma/schema.prisma', 'Database schema');
checkExists('.env.production', 'Production environment');

// 2. Check storage directories
console.log('\n📂 Checking storage directories:');
checkDirectory('storage', 'Main storage');
checkDirectory('storage/uploads', 'File uploads');
checkDirectory('storage/previews', 'Preview images');
checkDirectory('storage/profile-pictures', 'Profile pictures');
checkDirectory('storage/videos', 'Videos');
checkDirectory('storage/videos/hls', 'HLS video processing');
checkDirectory('logs', 'Application logs');

// 3. Check node_modules
console.log('\n📦 Checking dependencies:');
checkDirectory('node_modules', 'Node.js dependencies');
checkExists('node_modules/.prisma/client/index.js', 'Prisma client');

// 4. Check environment variables
console.log('\n🔧 Checking environment configuration:');
const envPath = path.join(backendDir, '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ALLOWED_ORIGINS',
    'FRONTEND_URL',
    'SERVER_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your-`) && !envContent.includes(`${varName}=http://localhost`)) {
      console.log(`✅ ${varName} is configured`);
    } else {
      console.log(`⚠️  ${varName} needs to be updated`);
    }
  });
}

// 5. Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Deployment verification PASSED!');
  console.log('\nYour backend is ready to run. Start it with:');
  console.log('  cd backend && npm start');
} else {
  console.log('❌ Deployment verification FAILED!');
  console.log('\nPlease fix the issues above before starting the server.');
}

console.log('\n📋 Quick checklist:');
console.log('□ Update .env.production with your actual values');
console.log('□ Ensure PostgreSQL database is running');
console.log('□ Configure firewall to allow traffic on your port');
console.log('□ Update Cloudflare Pages environment variables');
console.log('□ Test the connection from your frontend');