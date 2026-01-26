// backend/src/routes/files.routes.js - FIXED WITH AUTH
import express from 'express';
import * as filesController from '../controllers/files.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadFile, uploadPreview } from '../services/storage.service.js';
import { fileMetadataValidation } from '../utils/validators.js';
import { handleLargeUploads, handleUploadCompletion } from '../middleware/upload.js';

const router = express.Router();

// ALL file routes require authentication except preview images and view (for iframes)
router.get('/', authenticate, filesController.getAllFiles);
router.get('/:id', authenticate, filesController.getFileById);
router.get('/download/:filename', authenticate, filesController.downloadFile);

// View route is public for iframe embedding (but still checks file access in controller)
router.get('/view/:filename', filesController.viewFile);

// Preview images are public (for course cards, file cards)
router.options('/preview/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.status(200).end();
});
router.get('/preview/:filename', filesController.viewPreview);

// Video streaming endpoint (public for course content)
router.get('/video/:filename', filesController.viewVideo);

// Admin routes
router.post('/',
  authenticate,
  requireAdmin,
  handleLargeUploads,
  uploadFile.fields([
    { name: 'file', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
  ]),
  handleUploadCompletion,
  fileMetadataValidation,
  filesController.uploadFile
);

// Course content upload endpoint with enhanced upload handling
router.post('/upload-content',
  authenticate,
  requireAdmin,
  handleLargeUploads,
  uploadFile.single('file'),
  handleUploadCompletion,
  filesController.uploadCourseContent
);

// Course content download endpoint (separate from main file downloads)
router.get('/download-content/:filename', authenticate, filesController.downloadCourseContent);

router.put('/:id',
  authenticate,
  requireAdmin,
  handleLargeUploads,
  uploadFile.fields([
    { name: 'file', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
  ]),
  handleUploadCompletion,
  filesController.updateFile
);

router.delete('/:id',
  authenticate,
  requireAdmin,
  filesController.deleteFileRecord
);

// Update page counts for existing files
router.post('/update-page-counts',
  authenticate,
  requireAdmin,
  filesController.updatePageCounts
);

export default router;