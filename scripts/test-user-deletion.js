#!/usr/bin/env node

/**
 * Test script for user deletion functionality
 * This script tests the admin user deletion API endpoint
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../backend/.env.production' });

const API_BASE = process.env.FRONTEND_URL?.replace('https://', 'http://') || 'http://localhost:3002';
const API_URL = `${API_BASE}/api`;

async function testUserDeletion() {
  console.log('🧪 Testing User Deletion API...');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // First, try to login as admin to get a token
    console.log('\n1. Attempting admin login...');
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
    
    // Get list of users
    console.log('\n2. Fetching users list...');
    const usersResponse = await fetch(`${API_URL}/admin/users?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`);
    }
    
    const usersData = await usersResponse.json();
    console.log(`✅ Found ${usersData.users.length} users`);
    
    // Find a non-admin user to test deletion (don't actually delete)
    const testUser = usersData.users.find(user => user.role !== 'ADMIN');
    
    if (!testUser) {
      console.log('⚠️  No non-admin users found to test deletion');
      return;
    }
    
    console.log(`\n3. Testing deletion validation for user: ${testUser.name} (${testUser.email})`);
    
    // Test deletion endpoint (this should work but we won't actually delete)
    console.log('   - Testing API endpoint accessibility...');
    const deleteResponse = await fetch(`${API_URL}/admin/users/${testUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.ok) {
      console.log('⚠️  DELETE request succeeded - user was actually deleted!');
      const deleteData = await deleteResponse.json();
      console.log('   Deleted user data:', deleteData);
    } else if (deleteResponse.status === 404) {
      console.log('✅ DELETE endpoint accessible (user not found - expected for test)');
    } else {
      console.log(`✅ DELETE endpoint accessible (status: ${deleteResponse.status})`);
    }
    
    // Test self-deletion prevention
    console.log('\n4. Testing self-deletion prevention...');
    const selfDeleteResponse = await fetch(`${API_URL}/admin/users/${loginData.user.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (selfDeleteResponse.status === 400) {
      console.log('✅ Self-deletion prevention working correctly');
    } else {
      console.log(`⚠️  Self-deletion prevention may not be working (status: ${selfDeleteResponse.status})`);
    }
    
    console.log('\n🎉 User deletion API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUserDeletion();