// src/services/email.service.js - Email handling
import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporterInstance = null;

/**
 * Create email transporter
 */
function createTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  // Check if SMTP is configured
  if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS) {
    logger.warn('⚠️  SMTP not configured. Emails will be simulated.');
    return null;
  }

  transporterInstance = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_SECURE,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS.replace(/\s/g, '') // Remove any spaces
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });

  return transporterInstance;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email, token, name) {
  const transporter = createTransporter();
  const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: '이메일 인증 - 교육 플랫폼',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #0284c7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>이메일 인증</h1>
          </div>
          <div class="content">
            <p>안녕하세요 <strong>${name}</strong>님,</p>
            <p>가입해주셔서 감사합니다!</p>
            <p>아래 버튼을 클릭하여 이메일 주소를 인증해주세요:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">이메일 인증하기</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              이 인증 링크는 24시간 동안 유효합니다.
            </p>
          </div>
          <div class="footer">
            <p>이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`✓ Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('✗ Email send failed:', error);
      throw error;
    }
  } else {
    // Simulate email in development
    logger.info(`📧 [SIMULATED] Verification email to: ${email}`);
    logger.info(`   URL: ${verificationUrl}`);
    return false;
  }
}

/**
 * Send email change verification
 */
export async function sendEmailChangeVerification(email, token, name) {
  const transporter = createTransporter();
  const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: '이메일 변경 인증',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #0284c7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; }
          .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>이메일 변경 인증</h1>
          </div>
          <div class="content">
            <p>안녕하세요 <strong>${name}</strong>님,</p>
            <p>계정 이메일 변경 요청을 받았습니다.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">새 이메일 인증하기</a>
            </div>
            <div class="warning">
              <strong>보안 안내:</strong><br>
              이메일 변경을 요청하지 않으셨다면 즉시 비밀번호를 변경해주세요.
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      logger.error('Email send failed:', error);
      throw error;
    }
  } else {
    logger.info(`📧 [SIMULATED] Email change verification to: ${email}`);
    return false;
  }
}

/**
 * Send contact form email
 */
export async function sendContactFormEmail({ name, email, subject, message, attachments = [] }) {
  const transporter = createTransporter();

  // Beautiful HTML template for admin email
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content { 
          padding: 30px; 
        }
        .info-grid {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          padding: 8px 0;
        }
        .info-value {
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #2563eb;
        }
        .message-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .attachments {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer { 
          background: #f9fafb; 
          padding: 20px; 
          text-align: center; 
          color: #6b7280; 
          font-size: 14px;
        }
        .timestamp {
          color: #6b7280;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 새로운 고객 문의</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">반혜나 고객센터</p>
        </div>
        
        <div class="content">
          <div class="info-grid">
            <div class="info-label">👤 이름:</div>
            <div class="info-value">${name}</div>
            
            <div class="info-label">📧 이메일:</div>
            <div class="info-value">${email}</div>
            
            <div class="info-label">📝 제목:</div>
            <div class="info-value">${subject}</div>
          </div>
          
          <div class="message-box">
            <h3 style="margin-top: 0; color: #374151;">💬 문의 내용:</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0;">${message}</p>
          </div>
          
          ${attachments.length > 0 ? `
            <div class="attachments">
              <h3 style="margin-top: 0; color: #92400e;">📎 첨부 파일 (${attachments.length}개)</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="timestamp">
            📅 접수 시간: ${new Date().toLocaleString('ko-KR', { 
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div class="footer">
          <p>이 이메일은 반혜나 고객센터에서 자동으로 발송되었습니다.</p>
          <p>답변은 위 이메일 주소로 직접 보내주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Beautiful HTML template for user confirmation
  const userEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #059669 0%, #047857 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content { 
          padding: 30px; 
        }
        .success-box {
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .footer { 
          background: #f9fafb; 
          padding: 20px; 
          text-align: center; 
          color: #6b7280; 
          font-size: 14px;
        }
        .contact-info {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ 문의 접수 완료</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">반혜나</p>
        </div>
        
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #047857;">안녕하세요 ${name}님! 👋</h2>
            <p style="margin-bottom: 0; font-size: 16px;">문의해주셔서 감사합니다. 귀하의 문의가 성공적으로 접수되었습니다.</p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #374151;">📋 접수된 문의 내용</h3>
            <p><strong>제목:</strong> ${subject}</p>
            <p><strong>내용:</strong></p>
            <p style="background: #f1f5f9; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${message}</p>
            ${attachments.length > 0 ? `<p><strong>첨부 파일:</strong> ${attachments.length}개</p>` : ''}
          </div>
          
          <div class="contact-info">
            <h3 style="margin-top: 0; color: #1e40af;">📞 추가 문의</h3>
            <p>빠른 시일 내에 답변드리겠습니다. 추가 문의사항이 있으시면 언제든 연락해주세요.</p>
            <p><strong>이메일:</strong> info.banhannah@gmail.com</p>
            <p><strong>Instagram:</strong> @banhyena</p>
            <p><strong>KakaoTalk:</strong> 오픈채팅방 문의</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>반혜나 고객지원팀</strong></p>
          <p>이 이메일은 자동으로 발송되었습니다. 답변이 필요하시면 위 연락처로 문의해주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Email to admin with attachments
  const adminEmail = {
    from: ENV.EMAIL_FROM,
    to: ENV.SMTP_USER || ENV.ADMIN_EMAIL,
    replyTo: email,
    subject: `[반혜나 문의] ${subject}`,
    html: adminEmailHtml,
    attachments: attachments
  };

  // Confirmation to user (no attachments needed)
  const userEmail = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: '[반혜나] 문의 접수 확인 ✅',
    html: userEmailHtml
  };

  if (transporter) {
    try {
      await transporter.sendMail(adminEmail);
      await transporter.sendMail(userEmail);
      logger.info('✅ Contact form emails sent successfully with attachments');
      return true;
    } catch (error) {
      logger.error('❌ Contact form email failed:', error.message);
      
      // Fallback: Log the email content for development
      logger.info('📧 [EMAIL FALLBACK] Contact form details:', {
        from: name,
        email: email,
        subject: subject,
        message: message,
        attachments: attachments.length
      });
      
      // Return true so the contact form still works
      return true;
    }
  } else {
    logger.info(`📧 [SIMULATED] Contact form from: ${email}`);
    logger.info(`   Subject: ${subject}`);
    logger.info(`   Message: ${message}`);
    logger.info(`   Attachments: ${attachments.length}`);
    return true;
  }
}