const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');

const app = express();

// CORS configuration - allow requests from your frontend domains
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'https://banhannah.netlify.app', // Netlify URL
    'https://nichol-tunnellike-constrictively.ngrok-free.dev', // Add your ngrok URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_originalname
    const uniqueName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Upload file endpoint
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get your server's URL (you'll configure this)
    const serverUrl = process.env.SERVER_URL || `https://nichol-tunnellike-constrictively.ngrok-free.dev`;
    const fileUrl = `${serverUrl}/api/files/view/${req.file.filename}`; // Use view endpoint for browser viewing
    const downloadUrl = `${serverUrl}/api/files/download/${req.file.filename}`; // Download URL
    
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let pages = null;
    let previewImage = null;
    
    // Extract page count and preview image
    if (ext === '.pdf') {
      try {
        // Get PDF page count using pdf-lib
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        pages = `${pageCount} 페이지`;
        
        // For preview image, we'll use a simpler approach:
        // Use the view endpoint to generate a preview URL
        // Note: Generating actual preview images requires PDF rendering (poppler, pdf2png, etc.)
        // For now, we'll skip automatic preview image generation
        // Users can manually set preview images, or we can implement this later with poppler-utils
        previewImage = null;
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        // Continue without page count/preview if processing fails
      }
    } else if (ext === '.pptx' || ext === '.ppt') {
      // PowerPoint processing would require additional libraries (officegen, libreoffice, etc.)
      // For now, skip automatic detection
      pages = null;
      previewImage = null;
    }
    
    res.json({
      success: true,
      fileUrl: fileUrl, // For browser viewing
      downloadUrl: downloadUrl, // For downloading
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileId: req.file.filename,
      pages: pages, // Page/slide count (null if not detected)
      previewImage: previewImage // Preview image URL (null if not generated)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// View file endpoint (inline viewing)
app.get('/api/files/view/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Security: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Determine content type
    const ext = path.extname(safeFilename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip'
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(safeFilename)}"`);
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('View error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'File view failed' });
        }
      }
    });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'File view failed' });
  }
});

// Download file endpoint
app.get('/api/files/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Security: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(safeFilename)}"`);
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'File download failed' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Preview image endpoint
app.get('/api/files/preview/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const previewDir = path.join(uploadsDir, 'previews');
    const filePath = path.join(previewDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Preview not found' });
    }
    
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Preview failed' });
  }
});

// List files endpoint (optional, for admin)
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadedAt: stats.birthtime
      };
    });
    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file endpoint (optional, for admin)
app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Upload directory: ${uploadsDir}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
});
