// backend/src/services/storage.service.js - FIXED buildFileUrl function
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from '../config/env.js';
import { generateUniqueFilename } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directories
const STORAGE_DIR = path.resolve(__dirname, '../../storage');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const PREVIEWS_DIR = path.join(STORAGE_DIR, 'previews');
const PROFILE_DIR = path.join(STORAGE_DIR, 'profile-pictures');
const VIDEOS_DIR = path.join(STORAGE_DIR, 'videos');

// Create directories if they don't exist
[STORAGE_DIR, UPLOADS_DIR, PREVIEWS_DIR, PROFILE_DIR, VIDEOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`✓ Created directory: ${dir}`);
  }
});

/**
 * Multer storage configuration for general files
 */
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  }
});

/**
 * Multer storage for preview images
 */
const previewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PREVIEWS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  }
});

/**
 * Multer storage for profile pictures
 */
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `user-${req.user.id}-${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

/**
 * File filter for images only
 */
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

/**
 * File upload middleware
 */
export const uploadFile = multer({
  storage: fileStorage,
  limits: { fileSize: ENV.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

/**
 * Preview image upload middleware
 */
export const uploadPreview = multer({
  storage: previewStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
  fileFilter: imageFilter
});

/**
 * Profile picture upload middleware
 */
export const uploadProfilePicture = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter
});

/**
 * Video upload middleware
 */
export const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, VIDEOS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: ENV.MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

/**
 * Get file path
 */
export function getFilePath(filename, type = 'uploads') {
  const dirs = {
    uploads: UPLOADS_DIR,
    previews: PREVIEWS_DIR,
    profile: PROFILE_DIR,
    videos: VIDEOS_DIR
  };
  
  return path.join(dirs[type] || UPLOADS_DIR, filename);
}

/**
 * Delete file
 */
export function deleteFile(filename, type = 'uploads') {
  try {
    const filePath = getFilePath(filename, type);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`✓ File deleted: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('File deletion failed:', error);
    return false;
  }
}

/**
 * Build file URL - FIXED to return relative paths that work with proxy
 */
export function buildFileUrl(filename, type = 'uploads') {
  if (!filename) return null;
  
  const routes = {
    uploads: '/api/files/view',
    previews: '/api/files/preview',
    profile: '/api/files/profile',
    videos: '/api/videos/view'
  };
  
  const route = routes[type] || routes.uploads;
  
  // Return relative URL that works with Vite proxy
  return `${route}/${encodeURIComponent(filename)}`;
}