require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Debug environment loading (remove after testing)
console.log('JWT_SECRET loaded?', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'NOT LOADED');
console.log('Current working directory:', process.cwd());

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
const app = express();

// Trust proxy (CRITICAL for ngrok + rate-limiter + X-Forwarded-For)
app.set('trust proxy', 1);

// Security & basic middleware
app.use(helmet());
app.use(cookieParser());

// Increase timeout for large video uploads/streaming
app.use((req, res, next) => {
  req.setTimeout(1800000); // 30 minutes
  res.setTimeout(1800000);
  next();
});

// Body parsers (only once!)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ====================== FINAL CORS CONFIGURATION ======================
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/Postman/mobile

    // Allow everything localhost + ngrok in development
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('ngrok')
    ) {
      return callback(null, true);
    }

    // Production allowed domains (tighten this later)
    const allowed = [
      'https://banhannah.pages.dev',
      'https://nichol-tunnellike-constrictively.ngrok-free.dev'
    ];

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    console.log(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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

// Explicit OPTIONS handler (ensures preflight always succeeds)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range, ngrok-skip-browser-warning, Origin, Accept, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.status(204).end();
});

// Create directories
const uploadsDir = path.join(__dirname, 'uploads');
const previewsDir = path.join(uploadsDir, 'previews');
const dataDir = path.join(__dirname, 'data');

[uploadsDir, previewsDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config
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

// PDF preview function
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
    console.error('PDF preview error:', error);
    return false;
  }
}

// Initialize admin
async function initializeAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yewon.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existing) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: { email: adminEmail, name: adminName, password: hashed, role: 'ADMIN' }
      });
      console.log('✓ Admin created:', adminEmail);
    }
  } catch (err) {
    console.error('Admin init failed:', err);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// ... (keep all your other endpoints: purchase, upload, view, metadata, courses, reviews, etc.)

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, async () => {
  console.log(`✓ Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  await initializeAdmin();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});