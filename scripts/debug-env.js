#!/usr/bin/env node
// Debug environment variables

import { ENV } from '../backend/src/config/env.js';

console.log('🔍 Environment Debug Information:');
console.log('================================');
console.log('NODE_ENV:', ENV.NODE_ENV);
console.log('isProd:', ENV.isProd);
console.log('SERVER_URL:', ENV.SERVER_URL);
console.log('FRONTEND_URL:', ENV.FRONTEND_URL);
console.log('PORT:', ENV.PORT);
console.log('HOST:', ENV.HOST);
console.log('');

// Test buildFileUrl function
const { buildFileUrl } = await import('../backend/src/services/storage.service.js');

console.log('🔗 Testing buildFileUrl function:');
console.log('================================');
console.log('View URL:', buildFileUrl('test.pdf', 'uploads'));
console.log('Preview URL:', buildFileUrl('test.png', 'previews'));
console.log('Download URL:', buildFileUrl('test.pdf', 'download'));
console.log('');

console.log('✅ Debug complete!');