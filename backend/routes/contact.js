// backend/routes/contact.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendContactFormEmail } = require('../utils/email');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Contact form submission
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('이름을 입력해주세요'),
    body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
    body('subject').trim().notEmpty().withMessage('제목을 입력해주세요'),
    body('message').trim().notEmpty().withMessage('메시지를 입력해주세요')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { name, email, subject, message } = req.body;

      // Save to database
      const submission = await prisma.contactSubmission.create({
        data: {
          name,
          email,
          subject,
          message,
          emailSent: false
        }
      });

      // Send email
      try {
        await sendContactFormEmail({ name, email, subject, message });
        
        // Update submission status
        submission.emailSent = true;
        fs.writeFileSync(
          path.join(contactsDir, filename),
          JSON.stringify(submission, null, 2)
        );
        
        console.log('✅ Contact form email sent successfully');
        
        res.json({ 
          success: true, 
          message: '문의가 성공적으로 전송되었습니다. 빠른 시일 내에 답변 드리겠습니다.',
          emailSent: true
        });
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        console.error('Error details:', emailError.message);
        
        // Return success but indicate email issue
        res.json({ 
          success: true, 
          message: '문의가 접수되었습니다. 이메일 전송은 실패했지만 관리자가 확인할 수 있도록 저장되었습니다.',
          emailSent: false,
          warning: 'Email delivery failed but your message was saved'
        });
      }
    } catch (error) {
      console.error('❌ Contact form error:', error);
      res.status(500).json({ 
        error: '문의 전송 중 오류가 발생했습니다. 나중에 다시 시도해주세요.' 
      });
    }
  }
);

module.exports = router;