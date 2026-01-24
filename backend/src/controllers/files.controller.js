// src/controllers/files.controller.js
import { prisma } from '../config/database.js';
import { HTTP_STATUS } from '../config/constants.js';
import { deleteFile, getFilePath, buildFileUrl } from '../services/storage.service.js';
import path from 'path';
import fs from 'fs';

/**
 * Get all files (public)
 */
export async function getAllFiles(req, res, next) {
  try {
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
      ],
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });
    
    // Add URLs and ratings
    const filesWithData = await Promise.all(
      files.map(async (file) => {
        const reviews = await prisma.review.findMany({
          where: { itemType: 'file', itemId: file.id }
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
    
    res.json({ files: filesWithData });
  } catch (error) {
    next(error);
  }
}

/**
 * Get file by ID
 */
export async function getFileById(req, res, next) {
  try {
    const { id } = req.params;
    
    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
    }
    
    // Calculate average rating
    const avgRating = file.reviews.length > 0
      ? file.reviews.reduce((sum, r) => sum + r.rating, 0) / file.reviews.length
      : 0;
    
    res.json({
      file: {
        ...file,
        downloadUrl: buildFileUrl(file.filename, 'uploads'),
        previewUrl: file.previewImage ? buildFileUrl(file.previewImage, 'previews') : null,
        averageRating: Math.round(avgRating * 10) / 10
      }
    });
  } catch (error) {
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
      level
    } = req.body;
    
    const fileData = {
      title,
      description,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      format,
      level: level ? parseInt(level) : 1,
      published: false
    };
    
    if (previewImage) {
      fileData.previewImage = previewImage.filename;
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
    if (req.file) {
      if (file.previewImage) {
        deleteFile(file.previewImage, 'previews');
      }
      updateData.previewImage = req.file.filename;
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
 * Download file
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
 * View file (inline)
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
 * View preview image
 */
export async function viewPreview(req, res, next) {
  try {
    const { filename } = req.params;
    
    const filePath = getFilePath(filename, 'previews');
    
    if (!fs.existsSync(filePath)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Preview not found' });
    }
    
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const contentType = mimeTypes[ext] || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}