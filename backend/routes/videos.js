// backend/routes/videos.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const execAsync = promisify(exec);
const router = express.Router();
const prisma = new PrismaClient();

// Video storage configuration
const videosDir = path.join(__dirname, '../videos');
const hlsDir = path.join(__dirname, '../videos/hls');

// Create directories if they don't exist
[videosDir, hlsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for video uploads (admin only)
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videosDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 2147483648 }, // 2GB default
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed (mp4, mov, avi, mkv, webm)'));
  }
});

// ========== VIDEO UPLOAD (Admin only) ==========
router.post('/upload', authenticate, requireAdmin, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }

    const videoPath = req.file.path;
    const videoId = path.basename(req.file.filename, path.extname(req.file.filename));
    const hlsOutputDir = path.join(hlsDir, videoId);

    // Create HLS directory for this video
    if (!fs.existsSync(hlsOutputDir)) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }

    // Convert to HLS using ffmpeg
    console.log('Converting video to HLS format...');
    const hlsPath = path.join(hlsOutputDir, 'index.m3u8');
    
    // FFmpeg command for HLS conversion with multiple quality levels
    const ffmpegCommand = `ffmpeg -i "${videoPath}" \
      -profile:v baseline \
      -level 3.0 \
      -start_number 0 \
      -hls_time 10 \
      -hls_list_size 0 \
      -f hls \
      "${hlsPath}"`;

    await execAsync(ffmpegCommand);

    // Delete original video file to save space (keep only HLS)
    fs.unlinkSync(videoPath);

    console.log('✓ Video converted to HLS successfully');

    // Return video info
    res.json({
      success: true,
      videoId,
      message: 'Video uploaded and converted to HLS format',
      hlsUrl: `/api/videos/hls/${videoId}/index.m3u8`
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Video upload failed: ' + error.message });
  }
});

// ========== GENERATE VIDEO ACCESS TOKEN ==========
router.post('/token/:videoId', authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Check if video exists
    const hlsDir = path.join(__dirname, '../videos/hls', videoId);
    if (!fs.existsSync(hlsDir)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Find which course this video belongs to
    // This requires you to store video-to-course mapping in your database
    // For now, we'll check all courses and their lessons
    const courses = await prisma.course.findMany();
    
    let courseId = null;
    let lessonFound = false;
    
    for (const course of courses) {
      if (course.lessons && Array.isArray(course.lessons)) {
        for (const lesson of course.lessons) {
          if (lesson.videoUrl && lesson.videoUrl.includes(videoId)) {
            courseId = course.id;
            lessonFound = true;
            break;
          }
        }
      }
      if (lessonFound) break;
    }

    if (!courseId) {
      return res.status(404).json({ error: 'Video not associated with any course' });
    }

    const course = courses.find(c => c.id === courseId);

    // Check if user has access to this course
    if (course.type === 'paid') {
      // Check purchase records
      const purchases = JSON.parse(
        await fs.promises.readFile(
          path.join(__dirname, `../data/purchases_${userId}.json`),
          'utf-8'
        ).catch(() => '[]')
      );

      const purchase = purchases.find(p => p.courseId === courseId);
      
      if (!purchase) {
        return res.status(403).json({ error: 'Course not purchased' });
      }

      // Check if access has expired
      const purchasedAt = new Date(purchase.purchasedAt);
      const accessDuration = course.accessDuration || 30; // days
      const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > expiresAt) {
        return res.status(403).json({ error: 'Course access has expired' });
      }

      // Calculate remaining access time for token expiration
      const remainingTime = Math.floor((expiresAt - now) / 1000); // seconds
      
      // Generate token with expiration
      const token = jwt.sign(
        {
          userId,
          videoId,
          courseId,
          expiresAt: expiresAt.toISOString()
        },
        process.env.JWT_SECRET,
        { expiresIn: Math.min(remainingTime, 3600) } // Max 1 hour or remaining access time
      );

      return res.json({
        success: true,
        token,
        expiresIn: Math.min(remainingTime, 3600)
      });
    } else {
      // Free course - generate token with 1 hour expiration
      const token = jwt.sign(
        {
          userId,
          videoId,
          courseId,
          isFree: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        success: true,
        token,
        expiresIn: 3600
      });
    }

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// ========== SERVE HLS PLAYLIST (Token Protected) ==========
router.get('/hls/:videoId/index.m3u8', async (req, res) => {
  try {
    const { videoId } = req.params;
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if token is for this video
    if (decoded.videoId !== videoId) {
      return res.status(403).json({ error: 'Token not valid for this video' });
    }

    // Check domain restriction (Referer header)
    const referer = req.get('Referer') || req.get('Origin');
    const allowedDomains = (process.env.ALLOWED_DOMAINS || 'localhost').split(',').map(d => d.trim());
    
    if (referer && process.env.NODE_ENV === 'production') {
      try {
        const refererHost = new URL(referer).hostname;
        const isAllowed = allowedDomains.some(domain => 
          refererHost === domain || 
          refererHost.endsWith(`.${domain}`) ||
          refererHost.includes(domain)
        );
        
        if (!isAllowed) {
          console.log('Domain blocked:', refererHost, 'Allowed:', allowedDomains);
          return res.status(403).json({ error: 'Domain not allowed' });
        }
      } catch (urlError) {
        console.error('Error parsing referer URL:', urlError);
      }
    }

    // Serve the m3u8 playlist file
    const playlistPath = path.join(hlsDir, videoId, 'index.m3u8');
    
    if (!fs.existsSync(playlistPath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(playlistPath);

  } catch (error) {
    console.error('HLS playlist serve error:', error);
    res.status(500).json({ error: 'Failed to serve video' });
  }
});

// ========== SERVE HLS SEGMENTS (Token Protected) ==========
router.get('/hls/:videoId/:segment', async (req, res) => {
  try {
    const { videoId, segment } = req.params;
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if token is for this video
    if (decoded.videoId !== videoId) {
      return res.status(403).json({ error: 'Token not valid for this video' });
    }

    // Check domain restriction
    const referer = req.get('Referer') || req.get('Origin');
    const allowedDomains = (process.env.ALLOWED_DOMAINS || 'localhost').split(',').map(d => d.trim());
    
    if (referer && process.env.NODE_ENV === 'production') {
      try {
        const refererHost = new URL(referer).hostname;
        const isAllowed = allowedDomains.some(domain => 
          refererHost === domain || 
          refererHost.endsWith(`.${domain}`) ||
          refererHost.includes(domain)
        );
        
        if (!isAllowed) {
          console.log('Domain blocked:', refererHost, 'Allowed:', allowedDomains);
          return res.status(403).json({ error: 'Domain not allowed' });
        }
      } catch (urlError) {
        console.error('Error parsing referer URL:', urlError);
      }
    }

    // Serve the segment file
    const segmentPath = path.join(hlsDir, videoId, segment);
    
    if (!fs.existsSync(segmentPath)) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(segmentPath);

  } catch (error) {
    console.error('HLS segment serve error:', error);
    res.status(500).json({ error: 'Failed to serve video segment' });
  }
});

// ========== DELETE VIDEO (Admin only) ==========
router.delete('/:videoId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoDir = path.join(hlsDir, videoId);

    if (!fs.existsSync(videoDir)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete entire video directory
    fs.rmSync(videoDir, { recursive: true, force: true });

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({ error: 'Video deletion failed' });
  }
});

module.exports = router;