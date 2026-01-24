// frontend/src/utils/constants.js
// ============================================
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const COURSE_TYPES = {
  FREE: 'free',
  PAID: 'paid'
};

export const LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3
};

export const FILE_FORMATS = {
  PDF: 'PDF',
  ZIP: 'ZIP',
  DOCX: 'DOCX',
  PPTX: 'PPTX',
  XLSX: 'XLSX'
};