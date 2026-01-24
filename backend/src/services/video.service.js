// src/services/video.service.js - Video processing
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

const execAsync = promisify(exec);

const VIDEOS_DIR = path.resolve('./storage/videos');
const HLS_DIR = path.join(VIDEOS_DIR, 'hls');

// Ensure directories exist
if (!fs.existsSync(HLS_DIR)) {
  fs.mkdirSync(HLS_DIR, { recursive: true });
}

/**
 * Convert video to HLS format
 */
export async function convertToHLS(videoPath, videoId) {
  const hlsOutputDir = path.join(HLS_DIR, videoId);
  
  if (!fs.existsSync(hlsOutputDir)) {
    fs.mkdirSync(hlsOutputDir, { recursive: true });
  }

  const hlsPath = path.join(hlsOutputDir, 'index.m3u8');
  
  // FFmpeg command for HLS conversion
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

  try {
    logger.info(`Converting video to HLS: ${videoId}`);
    await execAsync(ffmpegCommand);
    
    // Delete original video to save space
    fs.unlinkSync(videoPath);
    
    // Write status file
    fs.writeFileSync(
      path.join(hlsOutputDir, 'status.json'),
      JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() })
    );
    
    logger.info(`✓ HLS conversion complete: ${videoId}`);
    return true;
  } catch (error) {
    logger.error(`✗ HLS conversion failed: ${videoId}`, error);
    
    // Write error status
    fs.writeFileSync(
      path.join(hlsOutputDir, 'status.json'),
      JSON.stringify({ status: 'failed', error: error.message, failedAt: new Date().toISOString() })
    );
    
    throw error;
  }
}

/**
 * Generate video access token
 */
export async function generateVideoToken(userId, videoId) {
  // Check if video exists
  const hlsDir = path.join(HLS_DIR, videoId);
  if (!fs.existsSync(hlsDir)) {
    throw new Error('Video not found');
  }

  // Find which course this video belongs to
  const courses = await prisma.course.findMany();
  let courseId = null;
  let isFree = false;

  for (const course of courses) {
    if (course.lessons && Array.isArray(course.lessons)) {
      for (const lesson of course.lessons) {
        if (lesson.content && Array.isArray(lesson.content)) {
          for (const block of lesson.content) {
            if (block.type === 'video' && block.data?.videoId === videoId) {
              courseId = course.id;
              isFree = course.type === 'free';
              break;
            }
          }
        }
        if (courseId) break;
      }
    }
    if (courseId) break;
  }

  // If video not assigned to any course, allow temporary access
  if (!courseId) {
    const token = jwt.sign(
      { userId, videoId, isFree: true, generatedAt: Date.now() },
      ENV.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return { token, expiresIn: 86400, access: { type: 'unassigned' } };
  }

  // Free course
  if (isFree) {
    const token = jwt.sign(
      { userId, videoId, courseId, isFree: true, generatedAt: Date.now() },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return { token, expiresIn: 3600, access: { type: 'free' } };
  }

  // Paid course - check purchase
  const purchase = await prisma.purchase.findFirst({
    where: { userId, courseId }
  });

  if (!purchase) {
    throw new Error('Course not purchased');
  }

  // Check if access expired
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  const purchasedAt = new Date(purchase.purchasedAt);
  const accessDuration = course.accessDuration || 30;
  const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000);
  
  if (new Date() > expiresAt) {
    throw new Error('Course access has expired');
  }

  // Generate token
  const remainingTime = Math.floor((expiresAt - new Date()) / 1000);
  const tokenExpiration = Math.min(remainingTime, 3600);

  const token = jwt.sign(
    { userId, videoId, courseId, expiresAt: expiresAt.toISOString(), generatedAt: Date.now() },
    ENV.JWT_SECRET,
    { expiresIn: tokenExpiration }
  );

  return {
    token,
    expiresIn: tokenExpiration,
    access: {
      type: 'paid',
      purchasedAt: purchase.purchasedAt,
      accessExpiresAt: expiresAt.toISOString(),
      remainingDays: Math.floor(remainingTime / (24 * 60 * 60))
    }
  };
}

/**
 * Get HLS playlist path
 */
export function getHLSPath(videoId) {
  return path.join(HLS_DIR, videoId, 'index.m3u8');
}

/**
 * Get HLS segment path
 */
export function getHLSSegment(videoId, segment) {
  return path.join(HLS_DIR, videoId, segment);
}

/**
 * Get video status
 */
export function getVideoStatus(videoId) {
  const statusPath = path.join(HLS_DIR, videoId, 'status.json');
  
  if (fs.existsSync(statusPath)) {
    return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  }

  const playlistPath = getHLSPath(videoId);
  if (fs.existsSync(playlistPath)) {
    return { status: 'completed' };
  }

  return { status: 'processing' };
}