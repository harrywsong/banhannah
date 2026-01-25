// backend/src/controllers/files.controller.js - FIXED WITH AUTH
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';
import { deleteFile, getFilePath, buildFileUrl } from '../services/storage.service.js';
import { getFilePageCount } from '../utils/pdfUtils.js';
import path from 'path';
import fs from 'fs';

/**
 * Get all files (REQUIRES AUTHENTICATION)
 */
export async function getAllFiles(req, res, next) {
  try {
    console.log('📁 Fetching all files');
    // Authentication is now required - checked by middleware
    const { format, level, search, featured } = req.query;
    
    const where = { published: true };
    
    if (format) where.format = format;
    if (level) where.level = parseInt(level);
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
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
          downloadUrl: buildFileUrl(file.filename, 'uploads'),
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
        downloadUrl: buildFileUrl(file.filename, 'uploads'),
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
    if (!req.files || !req.files.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'No file uploaded' });
    }
    
    const uploadedFile = req.files.file[0];
    const previewImage = req.files.preview ? req.files.preview[0] : null;
    
    const {
      title,
      description,
      format,
      level,
      published,
      featured
    } = req.body;
    
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
    }
    
    // Extract page count for supported formats
    try {
      const filePath = getFilePath(uploadedFile.filename, 'uploads');
      const pageCount = await getFilePageCount(filePath, format);
      if (pageCount !== null) {
        fileData.pageCount = pageCount;
      }
    } catch (error) {
      console.warn('Failed to extract page count:', error.message);
      // Continue without page count - it's not critical for file upload
    }
    
    const file = await prisma.file.create({
      data: fileData
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      message: 'File uploaded successfully',
      file: {
        ...file,
        downloadUrl: buildFileUrl(file.filename, 'uploads'),
        previewUrl: file.previewImage ? buildFileUrl(file.previewImage, 'previews') : null
      }
    });
  } catch (error) {
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
    const { filename } = req.params;
    
    const file = await prisma.file.findFirst({
      where: { filename }
    });
    
    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }
    
    const filePath = getFilePath(filename, 'uploads');
    
    if (!fs.existsSync(filePath)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found on disk' });
    }
    
    // Increment download count
    await prisma.file.update({
      where: { id: file.id },
      data: { downloads: { increment: 1 } }
    });
    
    res.download(filePath, file.originalName);
  } catch (error) {
    next(error);
  }
}

/**
 * View file (inline) (REQUIRES AUTHENTICATION)
 */
export async function viewFile(req, res, next) {
  try {
    const { filename } = req.params;
    
    const filePath = getFilePath(filename, 'uploads');
    
    if (!fs.existsSync(filePath)) {
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
      '.mp4': 'video/mp4'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (error) {
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
 * View preview image (public - for course/file previews)
 * FIXED: Added proper CORS headers and error handling
 */
export async function viewPreview(req, res, next) {
  try {
    const { filename } = req.params;
    
    // Security: validate filename (no path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = getFilePath(filename, 'previews');
    
    console.log('Attempting to serve preview:', {
      filename,
      filePath,
      exists: fs.existsSync(filePath)
    });
    
    if (!fs.existsSync(filePath)) {
      console.error('Preview file not found:', filePath);
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
    
    // Set comprehensive CORS headers for image serving
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Set specific origin instead of wildcard when credentials might be included
    const origin = req.headers.origin;
    if (origin && (origin.includes('vercel.app') || origin.includes('banhannah'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://banhannah.vercel.app');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
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