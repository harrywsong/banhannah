// backend/create-storage-dirs.js - Run this once to create all storage directories
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  'storage',
  'storage/uploads',
  'storage/previews',
  'storage/profile-pictures',
  'storage/videos',
  'storage/videos/hls',
  'logs'
];

console.log('Creating storage directories...\n');

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log('✓ Created:', fullPath);
  } else {
    console.log('✓ Exists:', fullPath);
  }
});

console.log('\n✅ All storage directories ready!');
console.log('\nDirectory structure:');
console.log('backend/');
console.log('  ├── storage/');
console.log('  │   ├── uploads/       (uploaded files)');
console.log('  │   ├── previews/      (preview images)');
console.log('  │   ├── profile-pictures/');
console.log('  │   └── videos/');
console.log('  │       └── hls/       (processed videos)');
console.log('  └── logs/              (application logs)');