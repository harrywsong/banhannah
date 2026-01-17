// backend/test-email.js - Email Testing Script
require('dotenv').config();
const { sendVerificationEmail, sendContactFormEmail } = require('./utils/email');

async function testEmail() {
  console.log('\n🧪 Testing Email Configuration...\n');
  
  // Display current configuration
  console.log('📧 Current SMTP Settings:');
  console.log('   Host:', process.env.SMTP_HOST);
  console.log('   Port:', process.env.SMTP_PORT);
  console.log('   User:', process.env.SMTP_USER);
  console.log('   Pass Length:', process.env.SMTP_PASS?.length, 'characters');
  console.log('   Pass (first 4 chars):', process.env.SMTP_PASS?.substring(0, 4) + '...');
  console.log('   From:', process.env.EMAIL_FROM);
  console.log('   Frontend URL:', process.env.FRONTEND_URL);
  console.log('');
  
  // Test 1: Verification Email
  console.log('📧 Test 1: Sending verification email...');
  try {
    const testToken = 'test_token_' + Date.now();
    const result = await sendVerificationEmail(
      process.env.SMTP_USER, // Send to yourself
      testToken,
      'Test User'
    );
    
    if (result) {
      console.log('✅ Test 1 PASSED: Verification email sent successfully!');
    } else {
      console.log('⚠️  Test 1: Email was simulated (SMTP not configured)');
    }
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error.message);
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('   1. Check your .env file has correct SMTP settings');
    console.error('   2. Verify SMTP_PASS has NO SPACES (should be 16 chars)');
    console.error('   3. Confirm 2FA is enabled on Google account');
    console.error('   4. Generate NEW app password if needed');
    console.error('   5. Check firewall allows outbound port 587');
    console.error('');
  }
  
  console.log('');
  
  // Test 2: Contact Form Email
  console.log('📧 Test 2: Sending contact form email...');
  try {
    const result = await sendContactFormEmail({
      name: 'Test User',
      email: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Contact Form',
      message: 'This is a test message from the email testing script.'
    });
    
    if (result) {
      console.log('✅ Test 2 PASSED: Contact form emails sent successfully!');
    } else {
      console.log('⚠️  Test 2: Email was simulated (SMTP not configured)');
    }
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error.message);
  }
  
  console.log('\n✅ Email testing complete!\n');
  console.log('📧 Check your inbox:', process.env.SMTP_USER);
  console.log('   (Don\'t forget to check spam folder)\n');
}

// Run tests
testEmail()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });