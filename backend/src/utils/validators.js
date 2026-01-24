// src/utils/validators.js - Custom validators
import { body, param, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

/**
 * Registration validation rules
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('이름을 입력해주세요')
    .isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('이메일을 입력해주세요')
    .isEmail().withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('비밀번호를 입력해주세요')
    .isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  
  validate
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('이메일을 입력해주세요')
    .isEmail().withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('비밀번호를 입력해주세요'),
  
  validate
];

/**
 * File metadata validation
 */
export const fileMetadataValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('파일 제목을 입력해주세요')
    .isLength({ min: 2, max: 200 }).withMessage('제목은 2-200자 사이여야 합니다'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('파일 설명을 입력해주세요')
    .isLength({ min: 1, max: 1000 }).withMessage('설명은 1-1000자 사이여야 합니다'),
  
  body('format')
    .trim()
    .notEmpty().withMessage('파일 형식을 입력해주세요'),
  
  body('level')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('레벨은 1, 2, 또는 3이어야 합니다'),
  
  validate
];

/**
 * Course validation
 */
export const courseValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('코스 제목을 입력해주세요')
    .isLength({ min: 2, max: 200 }).withMessage('제목은 2-200자 사이여야 합니다'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('코스 설명을 입력해주세요'),
  
  body('type')
    .isIn(['free', 'paid']).withMessage('유효한 코스 타입을 선택해주세요'),
  
  body('price')
    .if(body('type').equals('paid'))
    .notEmpty().withMessage('유료 코스는 가격을 입력해야 합니다'),
  
  validate
];

/**
 * Review validation
 */
export const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('평점은 1-5 사이여야 합니다'),
  
  body('comment')
    .trim()
    .notEmpty().withMessage('리뷰 내용을 입력해주세요')
    .isLength({ min: 1, max: 1000 }).withMessage('리뷰는 1-1000자 사이여야 합니다'),
  
  body('itemId')
    .isInt({ min: 1 }).withMessage('유효한 항목 ID를 입력해주세요'),
  
  body('itemType')
    .isIn(['file', 'course', 'class']).withMessage('유효한 항목 타입을 선택해주세요'),
  
  validate
];

/**
 * ID parameter validation
 */
export const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('유효한 ID를 입력해주세요'),
  
  validate
];