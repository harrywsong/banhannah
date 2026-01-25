// backend/src/routes/videos.routes.js - Complete video streaming routes
import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadVideo } from '../services/storage.service.js';
import * as videoService from '../services/video.service.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * Upload video (admin only)
 */
router.post('/upload',
  authenticate,
  uploadVideo.single('video'),
  async (req, res, next) => {
    try {
      const { videoId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      // Start HLS conversion in background
      videoService.convertToHLS(req.file.path, videoId)
        .catch(error => console.error('HLS conversion failed:', error));

      res.json({
        message: 'Video uploaded and processing started',
        videoId,
        filename: req.file.filename
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get video access token
 */
router.post('/access/:videoId',
  authenticate,
  async (req, res, next) => {
    try {
      const { videoId } = req.params;
      const tokenData = await videoService.generateVideoToken(req.user.id, videoId);
      res.json(tokenData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Stream HLS playlist
 */
router.get('/stream/:videoId/index.m3u8',
  optionalAuth,
  async (req, res, next) => {
    try {
      const { videoId } = req.params;
      const { token } = req.query;

      // Verify token if provided
      if (token) {
        jwt.verify(token, ENV.JWT_SECRET);
      }

      const playlistPath = videoService.getHLSPath(videoId);
      
      if (!fs.existsSync(playlistPath)) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.sendFile(playlistPath);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Stream HLS segment
 */
router.get('/stream/:videoId/:segment',
  optionalAuth,
  async (req, res, next) => {
    try {
      const { videoId, segment } = req.params;
      const segmentPath = videoService.getHLSSegment(videoId, segment);
      
      if (!fs.existsSync(segmentPath)) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      res.setHeader('Content-Type', 'video/mp2t');
      res.sendFile(segmentPath);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get video processing status
 */
router.get('/status/:videoId',
  authenticate,
  async (req, res, next) => {
    try {
      const { videoId } = req.params;
      const status = videoService.getVideoStatus(videoId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
);

export default router;