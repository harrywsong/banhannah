require('dotenv').config();

// Load path safely before using it in dotenv config
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Debug environment loading (remove after testing)
console.log('JWT_SECRET loaded?', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'NOT LOADED');
console.log('Current working directory:', process.cwd());

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');
const { promisify } = require('util');

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const contactRoutes = require('./routes/contact');

// Import middleware
const { authenticate, requireAdmin, optionalAuth } = require('./middleware/auth');
const { 
  fileMetadataValidation, 
  courseValidation, 
  reviewValidation,
  idValidation 
} = require('./middleware/validation');

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const app = express();

// Trust proxy - CRITICAL for ngrok + rate-limiter + X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cookieParser());

// DEBUG: log incoming preflight requests and optionally force permissive CORS
// Set DEBUG_CORS=true in the backend environment to enable a temporary wildcard response for debugging.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('DEBUG CORS: OPTIONS request', { path: req.originalUrl, origin: req.get('origin'), host: req.get('host') });
  }

  if (process.env.DEBUG_CORS === 'true') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, ngrok-skip-browser-warning, X-Requested-With, Accept, Origin, Cache-Control, If-None-Match');
  }

  next();
});

// ========== ADD THIS SECTION ==========
// Increase timeout limits for video uploads
app.use((req, res, next) => {
  // Set timeout to 30 minutes for video uploads
  req.setTimeout(1800000); // 30 minutes
  res.setTimeout(1800000);
  next();
});

// ============= COMPLETE CORS CONFIGURATION FIX =============
// REMOVE the duplicate express.json() on line 32-34 if it exists
// Keep only ONE set of body parser setup

// Increase body parser limits (KEEP THIS - it's already correct)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting - more permissive in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 10000,  // 10000 in dev, 100 in prod
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);


// ====================== IMPROVED & COMPLETE CORS CONFIGURATION ======================
// Allow specific origins; prefer environment override `ALLOWED_ORIGINS`
const defaultAllowed = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://banhannah.pages.dev',
  // support both common dynamic DNS providers and api subdomain
  'http://banhannah.ddns.org',
  'https://banhannah.ddns.org',
  'http://banhannah.dpdns.org',
  'https://banhannah.dpdns.org',
  'https://api.banhannah.ddns.org',
  'https://api.banhannah.dpdns.org'
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultAllowed.join(',')).split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // In non-production, also allow all origins to ease local/dev testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('DEV CORS allow for origin:', origin);
      return callback(null, true);
    }

    console.log('Blocked CORS for origin:', origin);
    // Return a clear error for blocked origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Range',
    'ngrok-skip-browser-warning',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'If-None-Match'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'Accept-Ranges',
    'Content-Type',
    'Authorization'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handler for extra safety
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range, ngrok-skip-browser-warning, Origin, Accept, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.status(204).end();
});

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const previewsDir = path.join(uploadsDir, 'previews');
const dataDir = path.join(__dirname, 'data'); // For storing purchase records
[uploadsDir, previewsDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 }
});

const videoUpload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 2147483648 }
});

// PDF preview generation
async function generatePDFPreview(pdfPath, outputPath) {
  try {
    const command = `pdftoppm -png -f 1 -l 1 -scale-to-x 800 -scale-to-y -1 "${pdfPath}" "${outputPath}"`;
    await execAsync(command);
    const outputFile = `${outputPath}-1.png`;
    if (fs.existsSync(outputFile)) {
      fs.renameSync(outputFile, outputPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('PDF preview generation error:', error);
    return false;
  }
}

// Initialize admin user on startup
async function initializeAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yewon.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: true
        }
      });
      console.log('✓ Admin user created (verified):', adminEmail);
      console.log('⚠ IMPORTANT: Change the admin password in production immediately!');
    } else {
      // Ensure existing admin matches .env credentials and is verified
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: adminName,
          emailVerified: true
        }
      });
      console.log('✓ Admin user updated/verified from .env:', adminEmail);
    }
  } catch (error) {
    console.error('Failed to initialize admin:', error);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/contact', contactRoutes);

// ========== COURSE PURCHASE ENDPOINT ==========
app.post('/api/courses/purchase', authenticate, async (req, res) => {
  try {
    const purchase = req.body;
    const userId = req.user.id;
    
    // Validate purchase data
    if (!purchase.courseId || !purchase.transactionId) {
      return res.status(400).json({ error: 'Invalid purchase data' });
    }
    
    // Save purchase to file system (in production, use database)
    const dataDir = path.join(__dirname, 'data');
    const purchasesFilePath = path.join(dataDir, `purchases_${userId}.json`);
    
    let purchases = [];
    if (fs.existsSync(purchasesFilePath)) {
      const purchasesData = fs.readFileSync(purchasesFilePath, 'utf-8');
      purchases = JSON.parse(purchasesData);
    }
    
    // Remove any existing purchase for this course
    purchases = purchases.filter(p => p.courseId !== purchase.courseId);
    
    // Add new purchase
    purchases.push({
      ...purchase,
      userId,
      savedAt: new Date().toISOString()
    });
    
    // Save to file
    fs.writeFileSync(purchasesFilePath, JSON.stringify(purchases, null, 2));
    
    res.json({ success: true, message: 'Purchase saved' });
  } catch (error) {
    console.error('Purchase save error:', error);
    res.status(500).json({ error: 'Failed to save purchase' });
  }
});

// ========== FILE UPLOAD ENDPOINTS ==========

app.post('/api/files/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Prefer explicit SERVER_URL, otherwise derive from the incoming request
    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
    // encode filename so spaces and special chars become safe in URLs
    const encodedFilename = encodeURIComponent(req.file.filename);
    const fileUrl = `${serverUrl}/api/files/view/${encodedFilename}`;
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let pages = null;
    let previewImage = null;
    
    if (ext === '.pdf') {
      try {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        pages = `${pdfDoc.getPageCount()} 페이지`;
        
        const previewFilename = `${req.file.filename.replace(ext, '')}.png`;
        const previewPath = path.join(previewsDir, previewFilename);
        const previewGenerated = await generatePDFPreview(filePath, previewPath);
        
        if (previewGenerated) {
          previewImage = `${serverUrl}/api/files/preview/${encodeURIComponent(previewFilename)}`;
        }
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
      }
    }
    
    res.json({
      success: true,
      fileUrl,
      downloadUrl: `${serverUrl}/api/files/download/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileId: req.file.filename,
      pages,
      previewImage
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/api/videos/upload', authenticate, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }
    
    // Prefer explicit SERVER_URL, otherwise derive from the incoming request
    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
    const videoUrl = `${serverUrl}/api/videos/view/${encodeURIComponent(req.file.filename)}`;
    
    res.json({
      success: true,
      videoUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileId: req.file.filename
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Video upload failed' });
  }
});

// View/download endpoints
app.get('/api/files/view/:filename', (req, res) => {
  try {
    console.log('DEBUG /api/files/view', { 
      method: req.method, 
      url: req.originalUrl, 
      filename: req.params.filename 
    });
    
    const safeFilename = decodeURIComponent(path.basename(req.params.filename));
    const filePath = path.join(uploadsDir, safeFilename);
    
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // ========== FIXED: Allow iframe embedding from your domains ==========
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://banhannah.pages.dev',
      'http://banhannah.ddns.org',
      'https://banhannah.ddns.org',
      'http://banhannah.dpdns.org',
      'https://banhannah.dpdns.org'
    ];
    
    const origin = req.get('origin') || req.get('referer');
    const isAllowedOrigin = allowedOrigins.some(allowed => 
      origin && origin.includes(allowed.replace(/^https?:\/\//, ''))
    );
    
    // Set CORS headers
    if (isAllowedOrigin || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Set content headers
    const ext = path.extname(safeFilename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    
    // ========== CRITICAL FIX: Remove restrictive CSP headers for file viewing ==========
    // Allow embedding in iframes from your domains
    const frameAncestors = allowedOrigins.join(' ');
    res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Override restrictive default
    
    // Cache control
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    console.log('✅ Sending file:', safeFilename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'File view failed' });
  }
});

app.get('/api/files/download/:filename', (req, res) => {
  try {
    console.log('DEBUG /api/files/download', { method: req.method, url: req.originalUrl, host: req.get('host'), origin: req.get('origin'), referer: req.get('referer'), ua: req.get('user-agent') });
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

app.get('/api/files/preview/:filename', (req, res) => {
  try {
    console.log('DEBUG /api/files/preview', { method: req.method, url: req.originalUrl, host: req.get('host'), origin: req.get('origin'), referer: req.get('referer'), ua: req.get('user-agent') });
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(previewsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Preview not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Preview failed' });
  }
});

app.get('/api/videos/view/:filename', (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Video view error:', error);
    res.status(500).json({ error: 'Video view failed' });
  }
});

// ========== FILE METADATA ENDPOINTS ==========

app.get('/api/files/metadata', optionalAuth, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

app.get('/api/files/metadata/:id', idValidation, optionalAuth, async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

app.post('/api/files/metadata', authenticate, requireAdmin, fileMetadataValidation, async (req, res) => {
  try {
    const file = await prisma.file.create({
      data: {
        ...req.body,
        downloads: 0
      }
    });
    res.json({ success: true, file });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

app.put('/api/files/metadata/:id', authenticate, requireAdmin, idValidation, async (req, res) => {
  try {
    const file = await prisma.file.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json({ success: true, file });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

app.delete('/api/files/metadata/:id', authenticate, requireAdmin, idValidation, async (req, res) => {
  try {
    await prisma.file.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.post('/api/files/metadata/:id/increment', idValidation, async (req, res) => {
  try {
    const file = await prisma.file.update({
      where: { id: parseInt(req.params.id) },
      data: { downloads: { increment: 1 } }
    });
    res.json({ success: true, file });
  } catch (error) {
    console.error('Increment error:', error);
    res.status(500).json({ error: 'Failed to increment' });
  }
});

// ========== COURSE METADATA ENDPOINTS ==========

app.get('/api/courses/metadata', optionalAuth, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to get courses' });
  }
});

app.get('/api/courses/metadata/:id', idValidation, optionalAuth, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to get course' });
  }
});

app.post('/api/courses/metadata', authenticate, requireAdmin, courseValidation, async (req, res) => {
  try {
    const course = await prisma.course.create({
      data: {
        ...req.body,
        students: 0
      }
    });
    res.json({ success: true, course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.put('/api/courses/metadata/:id', authenticate, requireAdmin, idValidation, async (req, res) => {
  try {
    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json({ success: true, course });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/metadata/:id', authenticate, requireAdmin, idValidation, async (req, res) => {
  try {
    await prisma.course.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ========== REVIEW ENDPOINTS ==========

app.get('/api/reviews', optionalAuth, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Mask names
    const maskedReviews = reviews.map(review => ({
      ...review,
      userName: maskName(review.user.name)
    }));
    
    res.json({ reviews: maskedReviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

app.post('/api/reviews', authenticate, reviewValidation, async (req, res) => {
  try {
    const { itemId, itemType, rating, comment } = req.body;
    
    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        itemId,
        itemType,
        rating,
        comment
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    
    res.json({ 
      success: true, 
      review: {
        ...review,
        userName: maskName(review.user.name)
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You have already reviewed this item' });
    }
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Helper function to mask names
function maskName(name) {
  if (!name) return '';
  const nameParts = name.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    const singleName = nameParts[0];
    if (singleName.length <= 1) return singleName;
    if (singleName.length === 2) return singleName[0] + '*';
    return singleName[0] + '*'.repeat(singleName.length - 2) + singleName[singleName.length - 1];
  } else {
    const firstPart = nameParts[0];
    const lastPart = nameParts[nameParts.length - 1];
    let masked = firstPart.length > 0 ? firstPart[0] + '*'.repeat(Math.max(0, firstPart.length - 1)) : '';
    masked += ' ' + '*'.repeat(Math.max(0, lastPart.length - 1)) + (lastPart.length > 0 ? lastPart[lastPart.length - 1] : '');
    return masked.trim();
  }
}

// Start server
// Default to 3002 (updated per deployment change)
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, async () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`✓ Server running on http://${displayHost}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS allowed origins: All origins allowed (development mode)`);
  
  // Warm up SMTP connection for instant emails
  const { warmupTransporter } = require('./utils/email');
  await warmupTransporter();
  
  await initializeAdmin();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});