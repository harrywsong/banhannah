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
  limits: { 
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 2147483648, // 2GB default
  },
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

router.post('/upload', authenticate, requireAdmin, videoUpload.single('video'), async (req, res) => {
  try {
    // Set a very long timeout for this specific route (2 hours)
    req.setTimeout(7200000); // 2 hours
    res.setTimeout(7200000);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }

    // Get course ID and lesson ID from request body (optional but helps track videos)
    const { courseId, lessonId } = req.body;


    const videoPath = req.file.path;
    const videoId = path.basename(req.file.filename, path.extname(req.file.filename));
    const hlsOutputDir = path.join(hlsDir, videoId);

    // Create HLS directory for this video
    if (!fs.existsSync(hlsOutputDir)) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }

    // Send immediate response to prevent timeout
    res.json({
      success: true,
      videoId,
      courseId, // Return courseId back so frontend knows which course this video belongs to
      lessonId,
      message: 'Video uploaded, conversion in progress...',
      hlsUrl: `/api/videos/hls/${videoId}/index.m3u8`,
      status: 'processing'
    });


    // Convert to HLS in background (don't await)
    (async () => {
      try {
        console.log(`[${videoId}] Starting HLS conversion...`);
        const hlsPath = path.join(hlsOutputDir, 'index.m3u8');
        
        // OPTIMIZED FFmpeg command - faster conversion
        const ffmpegCommand = `ffmpeg -i "${videoPath}" \
          -c:v libx264 \
          -preset veryfast \
          -crf 28 \
          -c:a aac \
          -b:a 128k \
          -ac 2 \
          -profile:v baseline \
          -level 3.0 \
          -start_number 0 \
          -hls_time 10 \
          -hls_list_size 0 \
          -hls_segment_filename "${hlsOutputDir}/segment%03d.ts" \
          -f hls \
          "${hlsPath}"`;

        await execAsync(ffmpegCommand);
        
        // Delete original video file to save space
        fs.unlinkSync(videoPath);
        
        console.log(`[${videoId}] ✓ HLS conversion complete`);
        
        // Store conversion status
        const statusPath = path.join(hlsOutputDir, 'status.json');
        fs.writeFileSync(statusPath, JSON.stringify({
          status: 'completed',
          completedAt: new Date().toISOString()
        }));
        
      } catch (error) {
        console.error(`[${videoId}] ✗ HLS conversion failed:`, error);
        
        // Store error status
        const statusPath = path.join(hlsOutputDir, 'status.json');
        fs.writeFileSync(statusPath, JSON.stringify({
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        }));
      }
    })();

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

    // Try to find which course this video belongs to
    const courses = await prisma.course.findMany();
        
    let courseId = null;
    let lessonFound = false;

    // Check all courses to find where this video is used
    for (const course of courses) {
      if (course.lessons && Array.isArray(course.lessons)) {
        for (const lesson of course.lessons) {
          // Check if lesson has content blocks with this video (NEW SYSTEM)
          if (lesson.content && Array.isArray(lesson.content)) {
            for (const block of lesson.content) {
              if (block.type === 'video' && block.data && block.data.url) {
                // Check if the URL contains this videoId
                if (block.data.url.includes(videoId) || 
                    (block.data.videoId && block.data.videoId === videoId)) {
                  courseId = course.id;
                  lessonFound = true;
                  console.log(`✓ Found video ${videoId} in course ${course.id}, lesson ${lesson.title}`);
                  break;
                }
              }
            }
          }
          // Also check legacy videoUrl field
          if (lesson.videoUrl && lesson.videoUrl.includes(videoId)) {
            courseId = course.id;
            lessonFound = true;
            console.log(`✓ Found video ${videoId} (legacy) in course ${course.id}, lesson ${lesson.title}`);
            break;
          }
          if (lessonFound) break;
        }
      }
      if (lessonFound) break;
    }

// If no course found, still allow access for testing
    // (this allows viewing uploaded videos even before they're assigned to courses)
    if (!courseId) {
      console.log('⚠️ Video not assigned to any course - generating temporary access token');
      const token = jwt.sign(
        {
          userId,
          videoId,
          isFree: true,
          generatedAt: Date.now()
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Longer expiry for testing
      );

      return res.json({
        success: true,
        token,
        expiresIn: 86400, // 24 hours
        access: {
          type: 'unassigned',
          message: 'Video not assigned to any course yet'
        }
      });
    }

    const course = courses.find(c => c.id === courseId);

    // ========== FREE COURSE ACCESS ==========
    if (course.type === 'free') {
      const token = jwt.sign(
        {
          userId,
          videoId,
          courseId,
          isFree: true,
          generatedAt: Date.now()
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        success: true,
        token,
        expiresIn: 3600,
        access: {
          type: 'free',
          courseTitle: course.title
        }
      });
    }

    // ========== PAID COURSE ACCESS VALIDATION ==========
    if (course.type === 'paid') {
      // Load purchases from file system (in production, use database)
      const purchasesFilePath = path.join(__dirname, `../data/purchases_${userId}.json`);
      
      let purchases = [];
      try {
        if (fs.existsSync(purchasesFilePath)) {
          const purchasesData = await fs.promises.readFile(purchasesFilePath, 'utf-8');
          purchases = JSON.parse(purchasesData);
        }
      } catch (error) {
        console.error('Error reading purchases:', error);
        return res.status(500).json({ error: 'Failed to verify purchase' });
      }

      // Find purchase for this course
      const purchase = purchases.find(p => p.courseId === courseId);
      
      if (!purchase) {
        return res.status(403).json({ 
          error: 'Course not purchased',
          code: 'NOT_PURCHASED',
          courseId,
          courseTitle: course.title,
          price: course.price
        });
      }

      // ========== CHECK ACCESS EXPIRATION ==========
      const purchasedAt = new Date(purchase.purchasedAt);
      const accessDuration = course.accessDuration || 30; // days
      const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > expiresAt) {
        // Access has expired
        const expiredDays = Math.floor((now - expiresAt) / (24 * 60 * 60 * 1000));
        
        return res.status(403).json({ 
          error: 'Course access has expired',
          code: 'ACCESS_EXPIRED',
          courseId,
          courseTitle: course.title,
          purchasedAt: purchase.purchasedAt,
          expiredAt: expiresAt.toISOString(),
          expiredDaysAgo: expiredDays,
          renewalPrice: course.price // Could be different for renewal
        });
      }

      // ========== CALCULATE REMAINING ACCESS TIME ==========
      const remainingTimeSeconds = Math.floor((expiresAt - now) / 1000);
      const remainingDays = Math.floor(remainingTimeSeconds / (24 * 60 * 60));
      
      // Token expiration: minimum of 1 hour or remaining access time
      const tokenExpiration = Math.min(remainingTimeSeconds, 3600);
      
      // Warn if access is expiring soon (within 7 days)
      const isExpiringSoon = remainingDays <= 7;
      
      // Generate token with expiration
      const token = jwt.sign(
        {
          userId,
          videoId,
          courseId,
          purchaseId: purchase.transactionId || purchase.id,
          expiresAt: expiresAt.toISOString(),
          generatedAt: Date.now()
        },
        process.env.JWT_SECRET,
        { expiresIn: tokenExpiration }
      );

      return res.json({
        success: true,
        token,
        expiresIn: tokenExpiration,
        access: {
          type: 'paid',
          courseTitle: course.title,
          purchasedAt: purchase.purchasedAt,
          accessExpiresAt: expiresAt.toISOString(),
          remainingDays,
          remainingSeconds: remainingTimeSeconds,
          isExpiringSoon,
          warning: isExpiringSoon ? `Access expires in ${remainingDays} days` : null
        }
      });
    }

    // Should never reach here
    return res.status(500).json({ error: 'Invalid course configuration' });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// ========== SERVE HLS PLAYLIST (Token Protected) ==========
router.get('/hls/:videoId/index.m3u8', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // CRITICAL: Only accept token from Authorization header (NOT query params)
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to query param ONLY in development mode
    if (!token && process.env.NODE_ENV !== 'production') {
      token = req.query.token;
      console.log('⚠️ DEV MODE: Accepting token from query param');
    }

    if (!token) {
      console.log('❌ Blocked: No valid token provided');
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN',
        hint: 'Token must be provided in Authorization header as "Bearer <token>"'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('❌ Token expired for video:', videoId);
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Your video access token has expired. Please refresh the page.'
        });
      }
      console.log('❌ Invalid token for video:', videoId);
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is for this video
    if (decoded.videoId !== videoId) {
      console.log('❌ Token mismatch:', decoded.videoId, 'vs', videoId);
      return res.status(403).json({ 
        error: 'Token not valid for this video',
        code: 'TOKEN_MISMATCH'
      });
    }

    // ========== ENHANCED SECURITY: CHECK REFERER/ORIGIN ==========
    const referer = req.get('Referer') || req.get('Origin');
    const allowedDomains = (process.env.ALLOWED_DOMAINS || 'localhost,127.0.0.1').split(',').map(d => d.trim());
    
    // In production, strictly enforce domain restrictions
    if (process.env.NODE_ENV === 'production') {
      if (!referer) {
        console.log('❌ Blocked: No referer header');
        return res.status(403).json({ 
          error: 'Direct video access not allowed',
          code: 'NO_REFERER'
        });
      }
      
      try {
        const refererHost = new URL(referer).hostname;
        const isAllowed = allowedDomains.some(domain => 
          refererHost === domain || 
          refererHost.endsWith(`.${domain}`)
        );
        
        if (!isAllowed) {
          console.log('❌ Blocked domain:', refererHost, 'Allowed:', allowedDomains);
          return res.status(403).json({ 
            error: 'Domain not allowed',
            code: 'INVALID_DOMAIN'
          });
        }
      } catch (urlError) {
        console.error('❌ Error parsing referer URL:', urlError);
        return res.status(403).json({ 
          error: 'Invalid referer',
          code: 'INVALID_REFERER'
        });
      }
    }

    // ========== ADDITIONAL CHECK: VERIFY ACCESS HASN'T EXPIRED ==========
    if (decoded.expiresAt && !decoded.isFree) {
      const expiresAt = new Date(decoded.expiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        console.log('❌ Course access expired:', decoded.expiresAt);
        return res.status(403).json({ 
          error: 'Course access has expired',
          code: 'ACCESS_EXPIRED',
          expiredAt: decoded.expiresAt
        });
      }
    }

    // Serve the m3u8 playlist file
    const playlistPath = path.join(__dirname, '../videos/hls', videoId, 'index.m3u8');
    
    if (!fs.existsSync(playlistPath)) {
      console.log('❌ Video file not found:', playlistPath);
      return res.status(404).json({ 
        error: 'Video not found',
        code: 'VIDEO_NOT_FOUND'
      });
    }

    // CRITICAL: Enhanced security headers
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Prevent embedding on other sites
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'"); // Modern frame protection
    res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // Prevent search engine indexing
    
    // CRITICAL: Strict CORS - only allow YOUR domain
    const allowedOrigin = req.get('origin');
    
    if (allowedOrigin && allowedDomains.some(domain => allowedOrigin.includes(domain))) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow all origins
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    } else {
      // Block CORS for unknown origins in production
      console.log('❌ CORS blocked for origin:', allowedOrigin);
      res.setHeader('Access-Control-Allow-Origin', 'null');
    }
    
    console.log('✅ Serving playlist for video:', videoId, 'to user:', decoded.userId);
    res.sendFile(playlistPath);

  } catch (error) {
    console.error('❌ HLS playlist serve error:', error);
    res.status(500).json({ 
      error: 'Failed to serve video',
      code: 'SERVER_ERROR'
    });
  }
});

// ========== SERVE HLS SEGMENTS (Token Protected) ==========
router.get('/hls/:videoId/:segment', async (req, res) => {
  try {
    const { videoId, segment } = req.params;
    
    // CRITICAL: Only accept token from Authorization header (NOT query params)
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to query param ONLY in development mode
    if (!token && process.env.NODE_ENV !== 'production') {
      token = req.query.token;
    }

    if (!token) {
      console.log('❌ Segment blocked: No valid token');
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is for this video
    if (decoded.videoId !== videoId) {
      return res.status(403).json({ 
        error: 'Token not valid for this video',
        code: 'TOKEN_MISMATCH'
      });
    }

    // Check domain restriction in production
    const referer = req.get('Referer') || req.get('Origin');
    const allowedDomains = (process.env.ALLOWED_DOMAINS || 'localhost,127.0.0.1').split(',').map(d => d.trim());
    
    if (process.env.NODE_ENV === 'production' && referer) {
      try {
        const refererHost = new URL(referer).hostname;
        const isAllowed = allowedDomains.some(domain => 
          refererHost === domain || 
          refererHost.endsWith(`.${domain}`)
        );
        
        if (!isAllowed) {
          console.log('❌ Segment blocked - invalid domain:', refererHost);
          return res.status(403).json({ 
            error: 'Domain not allowed',
            code: 'INVALID_DOMAIN'
          });
        }
      } catch (urlError) {
        console.error('❌ Error parsing referer URL:', urlError);
      }
    }

    // Verify access hasn't expired (for paid courses)
    if (decoded.expiresAt && !decoded.isFree) {
      const expiresAt = new Date(decoded.expiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        return res.status(403).json({ 
          error: 'Course access has expired',
          code: 'ACCESS_EXPIRED'
        });
      }
    }

    // Serve the segment file
    const segmentPath = path.join(__dirname, '../videos/hls', videoId, segment);
    
    if (!fs.existsSync(segmentPath)) {
      console.log('❌ Segment not found:', segmentPath);
      return res.status(404).json({ 
        error: 'Segment not found',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    // CRITICAL: Security headers for segments
    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    
    // CORS handling
    const allowedOrigin = req.get('origin');
    if (allowedOrigin && allowedDomains.some(domain => allowedOrigin.includes(domain))) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    } else if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    }
    
    res.sendFile(segmentPath);

  } catch (error) {
    console.error('❌ HLS segment serve error:', error);
    res.status(500).json({ 
      error: 'Failed to serve video segment',
      code: 'SERVER_ERROR'
    });
  }
});

router.get('/hls/:videoId/status', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Accept token from Authorization header OR query param
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to query param
    if (!token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }


    const videoDir = path.join(hlsDir, videoId);
    const statusPath = path.join(videoDir, 'status.json');
    
    if (!fs.existsSync(videoDir)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if status file exists
    if (fs.existsSync(statusPath)) {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      return res.json(status);
    }

    // Check if m3u8 exists (conversion complete)
    const playlistPath = path.join(videoDir, 'index.m3u8');
    if (fs.existsSync(playlistPath)) {
      return res.json({ status: 'completed' });
    }

    // Still processing
    return res.json({ status: 'processing' });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
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