// backend/middleware/validation.js
const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: errors.array()[0].msg,
      errors: errors.array() 
    });
  }
  next();
};

// Registration validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('이름을 입력해주세요')
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2-50자 사이여야 합니다'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('이메일을 입력해주세요')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요')
    .isLength({ min: 6 })
    .withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  
  validate
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('이메일을 입력해주세요')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요'),
  
  validate
];

// File metadata validation
const fileMetadataValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('파일 제목을 입력해주세요')
    .isLength({ min: 2, max: 200 })
    .withMessage('제목은 2-200자 사이여야 합니다'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('파일 설명을 입력해주세요')
    .isLength({ min: 10, max: 1000 })
    .withMessage('설명은 10-1000자 사이여야 합니다'),
  
  body('format')
    .trim()
    .notEmpty()
    .withMessage('파일 형식을 입력해주세요')
    .isIn(['PDF', 'ZIP', 'ZIP (MP3 + PDF)', 'DOCX', 'PPTX', '기타'])
    .withMessage('유효한 파일 형식을 선택해주세요'),
  
  body('fileUrl')
    .trim()
    .notEmpty()
    .withMessage('파일 URL을 입력해주세요')
    .custom((value) => {
      // Allow relative URLs starting with /api/
      if (value.startsWith('/api/')) {
        return true;
      }
      // Allow full URLs
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('유효한 URL 형식이 아닙니다');
      }
    })
    .withMessage('유효한 URL을 입력해주세요'),
  
  validate
];

// Course metadata validation
const courseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('코스 제목을 입력해주세요')
    .isLength({ min: 2, max: 200 })
    .withMessage('제목은 2-200자 사이여야 합니다'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('코스 설명을 입력해주세요')
    .isLength({ min: 10, max: 1000 })
    .withMessage('설명은 10-1000자 사이여야 합니다'),
  
  body('type')
    .isIn(['free', 'paid'])
    .withMessage('유효한 코스 타입을 선택해주세요 (free 또는 paid)'),
  
  body('price')
    .optional()
    .custom((value, { req }) => {
      if (req.body.type === 'paid' && !value) {
        throw new Error('유료 코스는 가격을 입력해야 합니다');
      }
      return true;
    }),
  
  body('accessDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('접근 기간은 1일 이상이어야 합니다'),
  
  validate
];

const liveClassValidation = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().min(10).max(1000).optional(),
  date: Joi.string().required(),
  time: Joi.string().required(),
  timezone: Joi.string().required(),
  duration: Joi.string().required(),
  platform: Joi.string().required(),
  meetingLink: Joi.string().uri().required(),
  instructor: Joi.string().required(),
  maxParticipants: Joi.number().integer().min(1).required(),
  registrationStart: Joi.string().required(),
  registrationEnd: Joi.string().required(),
  previewImage: Joi.string().uri().optional(),
  registeredCount: Joi.number().integer().min(0).optional(),
  createdAt: Joi.date().optional()
});

// Review validation
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('평점은 1-5 사이여야 합니다'),
  
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('리뷰 내용을 입력해주세요')
    .isLength({ min: 10, max: 1000 })
    .withMessage('리뷰는 10-1000자 사이여야 합니다'),
  
  body('itemId')
    .isInt({ min: 1 })
    .withMessage('유효한 항목 ID를 입력해주세요'),
  
  body('itemType')
    .isIn(['file', 'course', 'class'])
    .withMessage('유효한 항목 타입을 선택해주세요'),
  
  validate
];

// ID parameter validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 ID를 입력해주세요'),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  fileMetadataValidation,
  courseValidation,
  reviewValidation,
  idValidation,
  liveClassValidation
};