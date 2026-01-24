// src/utils/helpers.js - Common helper functions
import crypto from 'crypto';

/**
 * Mask name for privacy (e.g., "John Doe" -> "J*** D*e")
 */
export function maskName(name) {
  if (!name || typeof name !== 'string') return '';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    const single = parts[0];
    if (single.length <= 1) return single;
    if (single.length === 2) return single[0] + '*';
    return single[0] + '*'.repeat(single.length - 2) + single[single.length - 1];
  }
  
  return parts.map(part => {
    if (part.length <= 1) return part;
    if (part.length === 2) return part[0] + '*';
    return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
  }).join(' ');
}

/**
 * Generate random token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  const baseName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${timestamp}_${random}_${baseName}`;
}