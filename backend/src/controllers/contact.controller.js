// backend/src/controllers/contact.controller.js
import { sendContactFormEmail } from '../services/email.service.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;
    
    // Extract files from the fields structure
    const files = [];
    if (req.files) {
      ['image0', 'image1', 'image2'].forEach(fieldName => {
        if (req.files[fieldName]) {
          files.push(...req.files[fieldName]);
        }
      });
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: '모든 필수 필드를 입력해주세요.'
      });
    }

    // Sanitize inputs
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedEmail = email.trim().toLowerCase().substring(0, 255);
    const sanitizedSubject = subject.trim().substring(0, 200);
    const sanitizedMessage = message.trim().substring(0, 5000);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        error: '올바른 이메일 주소를 입력해주세요.'
      });
    }

    // Validate file count and types
    if (files.length > 3) {
      return res.status(400).json({
        error: '최대 3개의 파일만 첨부할 수 있습니다.'
      });
    }

    // Validate file types (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: '이미지 파일만 첨부할 수 있습니다. (JPG, PNG, GIF, WebP)'
        });
      }
    }

    // Send contact form email with attachments
    const attachments = files.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype
    }));

    const emailSent = await sendContactFormEmail({
      name: sanitizedName,
      email: sanitizedEmail,
      subject: `[${category}] ${sanitizedSubject}`,
      message: sanitizedMessage,
      attachments
    });

    // Clean up uploaded files after email is sent
    for (const file of files) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file after email:', unlinkError);
      }
    }

    // Log the contact form submission
    logger.info('Contact form submitted', {
      name: sanitizedName,
      email: sanitizedEmail,
      category,
      subject: sanitizedSubject,
      hasAttachments: files.length > 0,
      attachmentCount: files.length,
      emailSent
    });

    res.json({
      success: true,
      message: '문의가 성공적으로 전송되었습니다.'
    });

  } catch (error) {
    logger.error('Contact form submission error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      const allFiles = [];
      ['image0', 'image1', 'image2'].forEach(fieldName => {
        if (req.files[fieldName]) {
          allFiles.push(...req.files[fieldName]);
        }
      });
      
      // Clean up files after email is sent (success or failure)
      for (const file of allFiles) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file:', unlinkError);
        }
      }
    }

    res.status(500).json({
      error: '문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.'
    });
  }
};