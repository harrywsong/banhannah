// backend/src/middleware/upload.js
import { logger } from '../utils/logger.js';

/**
 * Middleware to handle large file uploads with extended timeouts
 */
export function handleLargeUploads(req, res, next) {
  // Check if this is a file upload request
  const isUpload = req.headers['content-type']?.includes('multipart/form-data');
  
  if (isUpload) {
    // Get content length to estimate file size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const sizeMB = contentLength / (1024 * 1024);
    
    // For large uploads (>50MB), extend timeouts significantly
    if (contentLength > 50 * 1024 * 1024) {
      const timeoutMs = Math.min(600000, Math.max(300000, contentLength / 1000)); // 5-10 minutes based on size
      
      req.setTimeout(timeoutMs);
      res.setTimeout(timeoutMs);
      
      logger.info(`Extended timeout for large upload: ${sizeMB.toFixed(1)}MB, timeout: ${timeoutMs/1000}s`);
      
      // Add progress logging for very large files
      if (contentLength > 100 * 1024 * 1024) {
        let bytesReceived = 0;
        let lastLogTime = Date.now();
        
        req.on('data', (chunk) => {
          bytesReceived += chunk.length;
          const now = Date.now();
          
          // Log progress every 10 seconds for very large uploads
          if (now - lastLogTime > 10000) {
            const progress = (bytesReceived / contentLength * 100).toFixed(1);
            logger.info(`Upload progress: ${progress}% (${(bytesReceived / 1024 / 1024).toFixed(1)}MB / ${sizeMB.toFixed(1)}MB)`);
            lastLogTime = now;
          }
        });
      }
    }
    
    // Handle upload errors more gracefully
    req.on('error', (error) => {
      logger.error('Upload request error:', error);
      if (!res.headersSent) {
        res.status(400).json({ 
          error: 'Upload failed due to connection error',
          code: error.code 
        });
      }
    });
    
    req.on('timeout', () => {
      logger.error('Upload request timeout');
      if (!res.headersSent) {
        res.status(408).json({ 
          error: 'Upload timeout - file may be too large or connection too slow' 
        });
      }
    });
    
    res.on('error', (error) => {
      logger.error('Upload response error:', error);
    });
  }
  
  next();
}

/**
 * Middleware to handle upload completion and cleanup
 */
export function handleUploadCompletion(req, res, next) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override send to add upload completion logging
  res.send = function(data) {
    if (req.file && req.headers['content-type']?.includes('multipart/form-data')) {
      const sizeMB = (req.file.size / 1024 / 1024).toFixed(1);
      logger.info(`Upload completed successfully: ${req.file.originalname} (${sizeMB}MB)`);
    }
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    if (req.file && req.headers['content-type']?.includes('multipart/form-data')) {
      const sizeMB = (req.file.size / 1024 / 1024).toFixed(1);
      logger.info(`Upload completed successfully: ${req.file.originalname} (${sizeMB}MB)`);
    }
    return originalJson.call(this, data);
  };
  
  next();
}