// Test email functionality
import { sendContactFormEmail } from './src/services/email.service.js';
import { logger } from './src/utils/logger.js';

async function testEmail() {
  try {
    console.log('🧪 Testing beautiful email templates...');
    
    const result = await sendContactFormEmail({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Email with Beautiful Template',
      message: 'This is a test message to verify the new beautiful email templates.\n\nIt supports multiple lines and proper formatting!',
      attachments: [
        { filename: 'test-document.pdf', path: '/fake/path/test.pdf' },
        { filename: 'screenshot.png', path: '/fake/path/image.png' }
      ]
    });

    if (result) {
      console.log('✅ Beautiful emails sent successfully!');
      console.log('📧 Check your inbox for the new template design');
    } else {
      console.log('📧 Email simulated (SMTP not configured)');
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();