// backend/src/controllers/files.controller.js - FIXED WITH AUTH
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';
import { deleteFile, getFilePath, buildFileUrl } from '../services/storage.service.js';
import { trackFileAccess, getUserAccessedFiles } from '../services/userFileAccess.service.js';
import { getFilePageCount } from '../utils/pdfUtils.js';
import path from 'path';
import fs from 'fs';

/**
 * Get all files (REQUIRES AUTHENTICATION)
 */
export async function getAllFiles(req, res, next) {
  try {
    console.log('📁 Fetching all files');
    console.log('User role:', req.user?.role);
    
    // Authentication is now required - checked by middleware
    const { format, level, search, featured } = req.query;

    const where = {};

    // Only show published files for non-admin users
    if (req.user?.role !== 'ADMIN') {
      where.published = true;
    }

    if (format) where.format = format;
    if (level) where.level = parseInt(level);
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    console.log('Query where clause:', where);

    const files = await prisma.file.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`✓ Found ${files.length} files`);

    // Add URLs and ratings - fetch reviews manually
    const filesWithData = await Promise.all(
      files.map(async (file) => {
        const reviews = await prisma.review.findMany({
          where: {
            itemType: 'file',
            itemId: file.id
          }
        });

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        return {
          ...file,
          downloadUrl: buildFileUrl(file.filename, 'download'),
          viewUrl: buildFileUrl(file.filename, 'uploads'),
          previewUrl: file.previewImage ? buildFileUrl(file.previewImage, 'previews') : null,
          reviewCount: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10
        };
      })
    );

    console.log('✓ Sending files data');
    res.json({ files: filesWithData });
  } catch (error) {
    console.error('❌ ERROR in getAllFiles:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    next(error);
  }
}

/**
 * Get file by ID (REQUIRES AUTHENTICATION)
 */
export async function getFileById(req, res, next) {
  try {
    console.log('📄 Fetching file:', req.params.id);
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) }
    });

    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }

    // Manually fetch reviews for this file
    const reviews = await prisma.review.findMany({
      where: {
        itemType: 'file',
        itemId: parseInt(id)
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    console.log('✓ Sending file data');
    res.json({
      file: {
        ...file,
        reviews,
        downloadUrl: buildFileUrl(file.filename, 'download'),
        viewUrl: buildFileUrl(file.filename, 'uploads'),
        previewUrl: file.previewImage ? buildFileUrl(file.previewImage, 'previews') : null,
        averageRating: Math.round(avgRating * 10) / 10
      }
    });
  } catch (error) {
    console.error('❌ ERROR in getFileById:');
    console.error('Message:', error.message);
    next(error);
  }
}

/**
 * Upload file (admin only)
 */
export async function uploadFile(req, res, next) {
  try {
    console.log('📁 File upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    if (!req.files || !req.files.file) {
      console.error('❌ No file uploaded');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'No file uploaded' });
    }

    const uploadedFile = req.files.file[0];
    const previewImage = req.files.preview ? req.files.preview[0] : null;

    console.log('📄 Uploaded file:', {
      filename: uploadedFile.filename,
      originalname: uploadedFile.originalname,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype
    });

    const {
      title,
      description,
      format,
      level,
      published,
      featured
    } = req.body;

    console.log('📝 Form data:', { title, description, format, level, published, featured });

    const fileData = {
      title,
      description,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      format,
      level: level ? parseInt(level) : 1,
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true
    };

    if (previewImage) {
      fileData.previewImage = previewImage.filename;
      console.log('🖼️ Preview image:', previewImage.filename);
    }

    console.log('💾 Saving to database:', fileData);

    // Extract page count for supported formats
    try {
      const filePath = getFilePath(uploadedFile.filename, 'uploads');
      const pageCount = await getFilePageCount(filePath, format);
      if (pageCount !== null) {
        fileData.pageCount = pageCount;
        console.log('📄 Page count extracted:', pageCount);
      }
    } catch (error) {
      console.warn('⚠️ Failed to extract page count:', error.message);
      // Continue without page count - it's not critical for file upload
    }

    const file = await prisma.file.create({
      data: fileData
    });

    console.log('✅ File saved to database:', file.id);

    res.status(HTTP_STATUS.CREATED).json({
      message: 'File uploaded successfully',
      file: {
        ...file,
        downloadUrl: buildFileUrl(file.filename, 'uploads'),
        previewUrl: file.previewImage ? buildFileUrl(file.previewImage, 'previews') : null
      }
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    next(error);
  }
}

/**
 * Update file (admin only)
 */
export async function updateFile(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      format,
      level,
      published,
      featured
    } = req.body;

    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) }
    });

    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (format !== undefined) updateData.format = format;
    if (level !== undefined) updateData.level = parseInt(level);
    if (published !== undefined) updateData.published = published === 'true' || published === true;
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;

    // Handle preview image
    if (req.files && req.files.preview && req.files.preview[0]) {
      if (file.previewImage) {
        deleteFile(file.previewImage, 'previews');
      }
      updateData.previewImage = req.files.preview[0].filename;
    }

    const updatedFile = await prisma.file.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      message: 'File updated successfully',
      file: {
        ...updatedFile,
        downloadUrl: buildFileUrl(updatedFile.filename, 'uploads'),
        previewUrl: updatedFile.previewImage ? buildFileUrl(updatedFile.previewImage, 'previews') : null
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete file (admin only)
 */
export async function deleteFileRecord(req, res, next) {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) }
    });

    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }

    // Delete physical files
    deleteFile(file.filename, 'uploads');
    if (file.previewImage) {
      deleteFile(file.previewImage, 'previews');
    }

    // Delete database record
    await prisma.file.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Download file (REQUIRES AUTHENTICATION)
 */
export async function downloadFile(req, res, next) {
  try {
    const { filename: rawFilename } = req.params;
    
    // Decode URL-encoded filename
    const filename = decodeURIComponent(rawFilename);
    
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const file = await prisma.file.findFirst({
      where: { 
        filename,
        published: true  // Only allow downloading published files
      }
    });

    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }

    // Try to find the file in uploads directory first, then videos directory
    let filePath = getFilePath(filename, 'uploads');
    
    if (!fs.existsSync(filePath)) {
      // Try videos directory for video files
      filePath = getFilePath(filename, 'videos');
      
      if (!fs.existsSync(filePath)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found on disk' });
      }
    }

    // Increment download count
    await prisma.file.update({
      where: { id: file.id },
      data: { downloads: { increment: 1 } }
    });

    // Track user file access
    await trackFileAccess(req.user.id, file.id, 'download');

    const finalName = file.originalName || file.filename;
    const encodedName = encodeURIComponent(finalName);

    // Set caching headers to prevent browser from using stale/incomplete copies
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Force attachment and handle non-ASCII filenames correctly
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);

    // Use res.download but handle connection abortions silently
    return res.download(filePath, finalName, (err) => {
      if (err) {
        // Silently handle common connection abortions
        if (err.code === 'ECONNABORTED' || err.code === 'EPIPE' || err.message?.includes('aborted')) {
          return;
        }
        console.error('Download error:', err);
        if (!res.headersSent) {
          next(err);
        }
      }
    });
  } catch (error) {
    console.error('Download controller error:', error);
    next(error);
  }
}

/**
 * View file (inline) - Public for iframe embedding
 */
export async function viewFile(req, res, next) {
  try {
    const { filename } = req.params;

    // Security: validate filename (no path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Track file access if user is authenticated
    if (req.user) {
      const file = await prisma.file.findFirst({
        where: { filename, published: true }
      });
      
      if (file) {
        await trackFileAccess(req.user.id, file.id, 'view');
      }
    }

    const filePath = getFilePath(filename, 'uploads');

    console.log('Viewing file:', {
      filename,
      filePath,
      exists: fs.existsSync(filePath)
    });

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Set headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');

    // Add CORS headers for iframe embedding
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        // Silently handle common connection abortions
        if (err.code === 'ECONNABORTED' || err.code === 'EPIPE' || err.message?.includes('aborted')) {
          return;
        }
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to send file' });
        }
      }
    });
  } catch (error) {
    console.error('View file error:', error);
    next(error);
  }
}

/**
 * Update page counts for existing files (admin only)
 */
export async function updatePageCounts(req, res, next) {
  try {
    const { updateExistingFilePageCounts } = await import('../utils/pdfUtils.js');
    const storageService = await import('../services/storage.service.js');

    const result = await updateExistingFilePageCounts(prisma, storageService);

    res.json({
      message: 'Page count update completed',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload course content file (admin only)
 */
export async function uploadCourseContent(req, res, next) {
  try {
    console.log('Course content upload request:', {
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        destination: req.file.destination,
        path: req.file.path
      } : null
    });

    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'No file uploaded' });
    }

    const uploadedFile = req.file;
    const { type } = req.body; // video, image, file

    // Build the appropriate URL based on type
    let fileUrl;
    
    if (type === 'video' || uploadedFile.mimetype.startsWith('video/')) {
      fileUrl = buildFileUrl(uploadedFile.filename, 'videos');
      console.log('Video uploaded, URL:', fileUrl);
    } else {
      // For images and other files, use the uploads directory
      fileUrl = buildFileUrl(uploadedFile.filename, 'uploads');
      console.log('File uploaded, URL:', fileUrl);
    }

    // Course content files are NOT saved to the main File table
    // They are handled separately and downloaded via a different mechanism
    console.log('Course content file uploaded successfully, not saving to File table');

    const responseData = {
      message: 'Course content uploaded successfully',
      file: {
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        size: uploadedFile.size,
        url: fileUrl,
        type: type || 'file'
      }
    };

    console.log('Sending response:', responseData);

    res.status(HTTP_STATUS.CREATED).json(responseData);
  } catch (error) {
    console.error('Course content upload error:', error);
    next(error);
  }
}
/**
 * View video file (for course content)
 */
export async function viewVideo(req, res, next) {
  try {
    const { filename } = req.params;

    // Security: validate filename (no path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = getFilePath(filename, 'videos');

    if (!fs.existsSync(filePath)) {
      console.error('Video file not found:', filePath);
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Support range requests for video streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Video view error:', error);
    next(error);
  }
}
export async function viewPreview(req, res, next) {
  try {
    const { filename } = req.params;

    // Security: validate filename (no path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    let filePath = getFilePath(filename, 'previews');

    // FALLBACK: If not in previews, check uploads
    if (!fs.existsSync(filePath)) {
      const uploadPath = getFilePath(filename, 'uploads');
      if (fs.existsSync(uploadPath)) {
        filePath = uploadPath;
      }
    }

    if (!fs.existsSync(filePath)) {
      console.error('Preview file not found in any storage:', filename);
      return res.status(404).json({ error: 'Preview not found' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'image/jpeg';

    // Set comprehensive CORS headers for image serving - ALWAYS set these first
    const origin = req.headers.origin;
    
    // Always allow localhost origins in development
    if (process.env.NODE_ENV === 'development' || 
        (origin && (origin.includes('localhost') || origin.includes('127.0.0.1')))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else if (origin && (origin.includes('vercel.app') || origin.includes('banhannah'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*'); // More permissive for images
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Set content headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    console.log(`Serving preview image: ${filename} (${contentType}) with CORS origin: ${res.getHeader('Access-Control-Allow-Origin')}`);

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to send file' });
        }
      }
    });
  } catch (error) {
    console.error('Preview error:', error);
    next(error);
  }
}
/**
 * Download course content file (REQUIRES AUTHENTICATION)
 * This is separate from main file downloads and doesn't require database lookup
 */
export async function downloadCourseContent(req, res, next) {
  try {
    const { filename: rawFilename } = req.params;
    
    // Decode URL-encoded filename
    const filename = decodeURIComponent(rawFilename);
    
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    console.log('Course content download request for:', filename);

    // Try to find the file in uploads directory first, then videos directory
    let filePath = getFilePath(filename, 'uploads');
    
    if (!fs.existsSync(filePath)) {
      // Try videos directory for video files
      filePath = getFilePath(filename, 'videos');
      
      if (!fs.existsSync(filePath)) {
        console.log('Course content file not found:', filename);
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
      }
    }

    console.log('Course content file found at:', filePath);

    // Extract original filename (remove timestamp prefix)
    const originalName = filename.replace(/^\d+_[a-z0-9]+_/, '');
    const encodedName = encodeURIComponent(originalName);

    // Set caching headers to prevent browser from using stale/incomplete copies
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Force attachment and handle non-ASCII filenames correctly
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);

    console.log('Starting course content download:', originalName);

    // Use res.download but handle connection abortions silently
    return res.download(filePath, originalName, (err) => {
      if (err) {
        // Silently handle common connection abortions
        if (err.code === 'ECONNABORTED' || err.code === 'EPIPE' || err.message?.includes('aborted')) {
          return;
        }
        console.error('Course content download error:', err);
        if (!res.headersSent) {
          next(err);
        }
      } else {
        console.log('Course content download completed:', originalName);
      }
    });
  } catch (error) {
    console.error('Course content download controller error:', error);
    next(error);
  }
}