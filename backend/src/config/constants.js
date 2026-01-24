// src/config/constants.js - Application constants
export const ROLES = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT'
};

export const COURSE_TYPES = {
  FREE: 'free',
  PAID: 'paid'
};

export const FILE_FORMATS = {
  PDF: 'PDF',
  ZIP: 'ZIP',
  ZIP_MP3_PDF: 'ZIP (MP3 + PDF)',
  DOCX: 'DOCX',
  PPTX: 'PPTX',
  XLSX: 'XLSX',
  OTHER: '기타'
};

export const REVIEW_ITEM_TYPES = {
  FILE: 'file',
  COURSE: 'course',
  CLASS: 'class'
};

export const LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error'
};