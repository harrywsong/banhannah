#!/usr/bin/env node

/**
 * Test script for video upload resilience
 * This script tests the improved upload handling for large files
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../backend/.env.production' });

const API_BASE = process.env.FRONTEND_URL?.replace('https://', 'http://') || 'http://localhost:3002';
const API_URL = `${API_BASE}/api`;

async function testVideoUploadResilience() {
  console.log('🎥 Testing Video Upload Resilience...');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // First, login as admin
    console.log('\n1. Logging in as admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@banhannah.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Admin login successful');
    
    // Create a test file (simulate a video file)
    console.log('\n2. Creating test file...');
    const testFilePath = path.join(process.cwd(), 'test-video.mp4');
    const testFileSize = 10 * 1024 * 1024; // 10MB test file
    const testBuffer = Buffer.alloc(testFileSize, 'A'); // Fill with 'A' characters
    
    fs.writeFileSync(testFilePath, testBuffer);
    console.log(`✅ Created test file: ${testFileSize / 1024 / 1024}MB`);
    
    // Test upload with timeout handling
    console.log('\n3. Testing upload with enhanced error handling...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('type', 'video');
    
    const uploadResponse = await fetch(`${API_URL}/files/upload-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData,
      timeout: 300000 // 5 minute timeout
    });
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload successful:', uploadData.file.filename);
      console.log(`   File size: ${(uploadData.file.size / 1024 / 1024).toFixed(1)}MB`);
      console.log(`   URL: ${uploadData.file.url}`);
    } else {
      console.log(`⚠️  Upload failed with status: ${uploadResponse.status}`);
      const errorData = await uploadResponse.text();
      console.log('   Error:', errorData);
    }
    
    // Clean up test file
    console.log('\n4. Cleaning up...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Video upload resilience test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Clean up on error
    const testFilePath = path.join(process.cwd(), 'test-video.mp4');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Cleaned up test file after error');
    }
    
    process.exit(1);
  }
}

// Run the test
testVideoUploadResilience();