// backend/src/routes/files.routes.js - FIXED WITH AUTH
import express from 'express';
import * as filesController from '../controllers/files.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadFile, uploadPreview } from '../services/storage.service.js';
import { fileMetadataValidation } from '../utils/validators.js';

const router = express.Router();

// ALL file routes require authentication except preview images
router.get('/', authenticate, filesController.getAllFiles);
router.get('/:id', authenticate, filesController.getFileById);
router.get('/download/:filename', authenticate, filesController.downloadFile);
router.get('/view/:filename', authenticate, filesController.viewFile);

// Preview images are public (for course cards, file cards)
router.get('/preview/:filename', filesController.viewPreview);

// Admin routes
router.post('/',
  authenticate,
  requireAdmin,
  uploadFile.fields([
    { name: 'file', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
  ]),
  fileMetadataValidation,
  filesController.uploadFile
);

router.put('/:id',
  authenticate,
  requireAdmin,
  uploadPreview.single('preview'),
  filesController.updateFile
);

router.delete('/:id',
  authenticate,
  requireAdmin,
  filesController.deleteFileRecord
);

export default router;