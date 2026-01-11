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

// Metadata storage file path
const metadataDir = path.join(__dirname, 'data');
const filesMetadataPath = path.join(metadataDir, 'files.json');
const coursesMetadataPath = path.join(metadataDir, 'courses.json');
const classesMetadataPath = path.join(metadataDir, 'classes.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

// Helper function to read JSON file
const readJsonFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

// Helper function to write JSON file
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// ========== FILE METADATA ENDPOINTS ==========

// Get all file metadata
app.get('/api/files/metadata', (req, res) => {
  try {
    const files = readJsonFile(filesMetadataPath);
    res.json({ files });
  } catch (error) {
    console.error('Get files metadata error:', error);
    res.status(500).json({ error: 'Failed to get files metadata' });
  }
});

// Get single file metadata
app.get('/api/files/metadata/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const files = readJsonFile(filesMetadataPath);
    const file = files.find(f => f.id === id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ file });
  } catch (error) {
    console.error('Get file metadata error:', error);
    res.status(500).json({ error: 'Failed to get file metadata' });
  }
});

// Create file metadata
app.post('/api/files/metadata', (req, res) => {
  try {
    const files = readJsonFile(filesMetadataPath);
    const newFile = {
      id: Date.now(),
      ...req.body,
      downloads: req.body.downloads || 0,
      createdAt: req.body.createdAt || new Date().toISOString()
    };
    files.push(newFile);
    if (writeJsonFile(filesMetadataPath, files)) {
      res.json({ success: true, file: newFile });
    } else {
      res.status(500).json({ error: 'Failed to save file metadata' });
    }
  } catch (error) {
    console.error('Create file metadata error:', error);
    res.status(500).json({ error: 'Failed to create file metadata' });
  }
});

// Update file metadata
app.put('/api/files/metadata/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const files = readJsonFile(filesMetadataPath);
    const index = files.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'File not found' });
    }
    files[index] = {
      ...files[index],
      ...req.body,
      id: files[index].id, // Preserve ID
      createdAt: files[index].createdAt, // Preserve creation date
      downloads: req.body.downloads !== undefined ? req.body.downloads : files[index].downloads
    };
    if (writeJsonFile(filesMetadataPath, files)) {
      res.json({ success: true, file: files[index] });
    } else {
      res.status(500).json({ error: 'Failed to update file metadata' });
    }
  } catch (error) {
    console.error('Update file metadata error:', error);
    res.status(500).json({ error: 'Failed to update file metadata' });
  }
});

// Delete file metadata
app.delete('/api/files/metadata/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const files = readJsonFile(filesMetadataPath);
    const index = files.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'File not found' });
    }
    files.splice(index, 1);
    if (writeJsonFile(filesMetadataPath, files)) {
      res.json({ success: true, message: 'File metadata deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete file metadata' });
    }
  } catch (error) {
    console.error('Delete file metadata error:', error);
    res.status(500).json({ error: 'Failed to delete file metadata' });
  }
});

// Increment file access count
app.post('/api/files/metadata/:id/increment', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const files = readJsonFile(filesMetadataPath);
    const index = files.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'File not found' });
    }
    files[index].downloads = (files[index].downloads || 0) + 1;
    if (writeJsonFile(filesMetadataPath, files)) {
      res.json({ success: true, file: files[index] });
    } else {
      res.status(500).json({ error: 'Failed to increment access count' });
    }
  } catch (error) {
    console.error('Increment access count error:', error);
    res.status(500).json({ error: 'Failed to increment access count' });
  }
});

// List files endpoint (for physical file listing)
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

// Delete physical file endpoint
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
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ========== COURSE METADATA ENDPOINTS ==========

// Get all course metadata
app.get('/api/courses/metadata', (req, res) => {
  try {
    const courses = readJsonFile(coursesMetadataPath);
    res.json({ courses });
  } catch (error) {
    console.error('Get courses metadata error:', error);
    res.status(500).json({ error: 'Failed to get courses metadata' });
  }
});

// Get single course metadata
app.get('/api/courses/metadata/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courses = readJsonFile(coursesMetadataPath);
    const course = courses.find(c => c.id === id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ course });
  } catch (error) {
    console.error('Get course metadata error:', error);
    res.status(500).json({ error: 'Failed to get course metadata' });
  }
});

// Create course metadata
app.post('/api/courses/metadata', (req, res) => {
  try {
    const courses = readJsonFile(coursesMetadataPath);
    const newCourse = {
      id: Date.now(),
      ...req.body,
      students: req.body.students || 0,
      createdAt: req.body.createdAt || new Date().toISOString()
    };
    courses.push(newCourse);
    if (writeJsonFile(coursesMetadataPath, courses)) {
      res.json({ success: true, course: newCourse });
    } else {
      res.status(500).json({ error: 'Failed to save course metadata' });
    }
  } catch (error) {
    console.error('Create course metadata error:', error);
    res.status(500).json({ error: 'Failed to create course metadata' });
  }
});

// Update course metadata
app.put('/api/courses/metadata/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courses = readJsonFile(coursesMetadataPath);
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    courses[index] = {
      ...courses[index],
      ...req.body,
      id: courses[index].id, // Preserve ID
      createdAt: courses[index].createdAt, // Preserve creation date
      students: req.body.students !== undefined ? req.body.students : courses[index].students
    };
    if (writeJsonFile(coursesMetadataPath, courses)) {
      res.json({ success: true, course: courses[index] });
    } else {
      res.status(500).json({ error: 'Failed to update course metadata' });
    }
  } catch (error) {
    console.error('Update course metadata error:', error);
    res.status(500).json({ error: 'Failed to update course metadata' });
  }
});

// Delete course metadata
app.delete('/api/courses/metadata/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courses = readJsonFile(coursesMetadataPath);
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    courses.splice(index, 1);
    if (writeJsonFile(coursesMetadataPath, courses)) {
      res.json({ success: true, message: 'Course metadata deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete course metadata' });
    }
  } catch (error) {
    console.error('Delete course metadata error:', error);
    res.status(500).json({ error: 'Failed to delete course metadata' });
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Upload directory: ${uploadsDir}`);
  console.log(`Metadata directory: ${metadataDir}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
});
