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

  body('level')
    .optional()
    .isIn(['1', '2', '3', 1, 2, 3])
    .withMessage('유효한 레벨을 선택해주세요 (1, 2, 또는 3)'),
  
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
  .optional({ checkFalsy: true }) // Allow empty/null values
  .custom((value, { req }) => {
    // Only require for paid courses
    if (req.body.type === 'paid' && !value) {
      throw new Error('유료 코스는 접근 기간을 입력해야 합니다');
    }
    // If provided, must be valid
    if (value && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
      throw new Error('접근 기간은 1일 이상이어야 합니다');
    }
    return true;
  }),

  body('level')
    .optional()
    .isIn(['1', '2', '3', 1, 2, 3])
    .withMessage('유효한 레벨을 선택해주세요 (1, 2, 또는 3)'),
  
  validate
];

// Live class validation
const liveClassValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('라이브 클래스 제목을 입력해주세요')
    .isLength({ min: 2, max: 200 })
    .withMessage('제목은 2-200자 사이여야 합니다'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('설명은 1000자 이하여야 합니다'),
  
  body('date')
    .notEmpty()
    .withMessage('날짜를 입력해주세요'),
  
  body('time')
    .notEmpty()
    .withMessage('시간을 입력해주세요'),
  
  body('timezone')
    .notEmpty()
    .withMessage('타임존을 입력해주세요'),
  
  body('duration')
    .notEmpty()
    .withMessage('수업 시간을 입력해주세요'),
  
  body('platform')
    .notEmpty()
    .withMessage('플랫폼을 입력해주세요'),
  
  body('meetingLink')
    .notEmpty()
    .withMessage('미팅 링크를 입력해주세요')
    .isURL()
    .withMessage('유효한 URL을 입력해주세요'),
  
  body('instructor')
    .notEmpty()
    .withMessage('강사 이름을 입력해주세요'),
  
  body('maxParticipants')
    .isInt({ min: 1 })
    .withMessage('최대 참가자는 1명 이상이어야 합니다'),
  
  body('registrationStart')
    .notEmpty()
    .withMessage('등록 시작일을 입력해주세요'),
  
  body('registrationEnd')
    .notEmpty()
    .withMessage('등록 마감일을 입력해주세요'),
  
  body('previewImage')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty
      
      // Allow filenames (just the filename, not full URL)
      if (!value.includes('://')) {
        return true;
      }
      
      // Allow relative URLs starting with /api/
      if (value.startsWith('/api/')) {
        return true;
      }
      
      // Allow full URLs
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('유효한 이미지 파일명 또는 URL을 입력해주세요');
      }
    })
    .withMessage('유효한 이미지 파일명 또는 URL을 입력해주세요'),

  body('level')
    .optional()
    .isIn(['1', '2', '3', 1, 2, 3])
    .withMessage('유효한 레벨을 선택해주세요 (1, 2, 또는 3)'),
  
  validate
];


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
  
  // ✅ ADDED: Optional itemTitle validation
  body('itemTitle')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('항목 제목은 1-500자 사이여야 합니다'),
  
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