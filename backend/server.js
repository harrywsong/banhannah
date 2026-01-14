require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
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
const app = express();  // ← Create app FIRST

// Security middleware
app.use(helmet());
app.use(cookieParser());

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

// Rate limiting (KEEP THIS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// ============= UPDATED CORS CONFIGURATION =============
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://nichol-tunnellike-constrictively.ngrok-free.dev'

];

// Simplified CORS - allow all origins in development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, ngrok)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.includes(allowed) || allowed.includes(origin))) {
      return callback(null, true);
    }
    
    // Allow localhost in any mode for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning', // This is already here
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent'
  ],
  // UPDATE THIS LINE:
  exposedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Explicitly handle all OPTIONS requests (preflight)
app.options('*', cors(corsOptions));

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
          role: 'ADMIN'
        }
      });
      console.log('✓ Admin user created:', adminEmail);
      console.log('⚠ IMPORTANT: Change the admin password immediately!');
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
    
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
    const fileUrl = `${serverUrl}/api/files/view/${req.file.filename}`;
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
          previewImage = `${serverUrl}/api/files/preview/${previewFilename}`;
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
    
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
    const videoUrl = `${serverUrl}/api/videos/view/${req.file.filename}`;
    
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
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'File view failed' });
  }
});

app.get('/api/files/download/:filename', (req, res) => {
  try {
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
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, async () => {
  console.log(`✓ Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS allowed origins: ${allowedOrigins.join(', ')}`);
  await initializeAdmin();
});