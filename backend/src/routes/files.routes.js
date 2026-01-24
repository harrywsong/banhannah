// src/routes/files.routes.js
import express from 'express';
import * as filesController from '../controllers/files.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadFile, uploadPreview } from '../services/storage.service.js';
import multer from 'multer';
import { fileMetadataValidation } from '../utils/validators.js';

const router = express.Router();

// Configure multer for multiple files
const upload = multer().fields([
  { name: 'file', maxCount: 1 },
  { name: 'preview', maxCount: 1 }
]);

// Public routes
router.get('/', filesController.getAllFiles);
router.get('/:id', filesController.getFileById);
router.get('/download/:filename', filesController.downloadFile);
router.get('/view/:filename', filesController.viewFile);
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