#!/usr/bin/env node

/**
 * Test script to check reviews API and database content
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../backend/.env.production' });

const API_BASE = process.env.FRONTEND_URL?.replace('https://', 'http://') || 'http://localhost:3002';
const API_URL = `${API_BASE}/api`;

async function testReviewsAPI() {
  console.log('🔍 Testing Reviews API...');
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
    
    // Test the reviews API endpoint
    console.log('\n2. Fetching all reviews...');
    const reviewsResponse = await fetch(`${API_URL}/admin/reviews/all?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!reviewsResponse.ok) {
      throw new Error(`Reviews API failed: ${reviewsResponse.status} ${reviewsResponse.statusText}`);
    }
    
    const reviewsData = await reviewsResponse.json();
    console.log(`✅ Reviews API responded successfully`);
    console.log(`📊 Total reviews found: ${reviewsData.pagination?.total || reviewsData.reviews?.length || 0}`);
    console.log(`📄 Reviews on this page: ${reviewsData.reviews?.length || 0}`);
    console.log(`📑 Total pages: ${reviewsData.pagination?.pages || 1}`);
    
    if (reviewsData.reviews && reviewsData.reviews.length > 0) {
      console.log('\n📝 Sample reviews:');
      reviewsData.reviews.slice(0, 3).forEach((review, index) => {
        console.log(`   ${index + 1}. ${review.user?.name || 'Unknown'}: "${review.comment?.substring(0, 50)}..." (${review.rating}⭐)`);
        console.log(`      Type: ${review.itemType}, Item: ${review.item?.title || 'Unknown'}`);
      });
    } else {
      console.log('⚠️  No reviews found in the database');
      
      // Let's check if there are any reviews at all in the database
      console.log('\n3. Checking for any reviews in database...');
      
      // We can't directly query the database from here, but let's try different API calls
      const allReviewsResponse = await fetch(`${API_URL}/admin/reviews/all?limit=100&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (allReviewsResponse.ok) {
        const allReviewsData = await allReviewsResponse.json();
        console.log(`📊 Extended search - Total reviews: ${allReviewsData.pagination?.total || 0}`);
      }
    }
    
    // Test different filter combinations
    console.log('\n4. Testing filters...');
    
    // Test file reviews
    const fileReviewsResponse = await fetch(`${API_URL}/admin/reviews/all?itemType=file&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (fileReviewsResponse.ok) {
      const fileReviewsData = await fileReviewsResponse.json();
      console.log(`📁 File reviews: ${fileReviewsData.reviews?.length || 0}`);
    }
    
    // Test course reviews
    const courseReviewsResponse = await fetch(`${API_URL}/admin/reviews/all?itemType=course&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (courseReviewsResponse.ok) {
      const courseReviewsData = await courseReviewsResponse.json();
      console.log(`📚 Course reviews: ${courseReviewsData.reviews?.length || 0}`);
    }
    
    console.log('\n🎉 Reviews API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testReviewsAPI();