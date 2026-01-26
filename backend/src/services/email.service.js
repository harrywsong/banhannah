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

  // Professional HTML template for admin email
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>새로운 고객 문의</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f9fafb;
          padding: 20px;
        }
        .email-container { 
          max-width: 650px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }
        .header { 
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        .header-content {
          position: relative;
          z-index: 1;
        }
        .header h1 { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        .content { 
          padding: 40px 30px; 
        }
        .alert-badge {
          display: inline-flex;
          align-items: center;
          background: #fef3c7;
          color: #92400e;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid #fbbf24;
        }
        .customer-info {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .info-row {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .info-icon {
          width: 40px;
          height: 40px;
          background: #dbeafe;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          flex-shrink: 0;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .info-value {
          color: #1f2937;
          font-size: 16px;
          word-break: break-word;
        }
        .message-section {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .message-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .message-content {
          white-space: pre-wrap;
          line-height: 1.7;
          color: #374151;
          font-size: 15px;
        }
        .attachments-section {
          background: #fffbeb;
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .attachment-list {
          list-style: none;
          margin: 12px 0 0 0;
        }
        .attachment-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          color: #92400e;
          font-weight: 500;
        }
        .footer { 
          background: #f9fafb; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb;
        }
        .footer-content {
          color: #6b7280; 
          font-size: 14px;
          line-height: 1.6;
        }
        .timestamp {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-left: 4px solid #3b82f6;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .reply-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <h1>새로운 고객 문의</h1>
            <p>반혜나 고객센터</p>
          </div>
        </div>
        
        <div class="content">
          <div class="alert-badge">
            🔔 새 문의 알림
          </div>
          
          <div class="customer-info">
            <div class="info-row">
              <div class="info-icon">👤</div>
              <div>
                <div class="info-label">고객명</div>
                <div class="info-value">${name}</div>
              </div>
            </div>
            
            <div class="info-row">
              <div class="info-icon">📧</div>
              <div>
                <div class="info-label">이메일 주소</div>
                <div class="info-value">${email}</div>
              </div>
            </div>
            
            <div class="info-row">
              <div class="info-icon">📝</div>
              <div>
                <div class="info-label">문의 제목</div>
                <div class="info-value">${subject}</div>
              </div>
            </div>
          </div>
          
          <div class="message-section">
            <div class="message-header">
              <h3 style="color: #374151; font-size: 18px; margin: 0;">💬 문의 내용</h3>
            </div>
            <div class="message-content">${message}</div>
          </div>
          
          ${attachments.length > 0 ? `
            <div class="attachments-section">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📎 첨부 파일 (${attachments.length}개)</h3>
              <ul class="attachment-list">
                ${attachments.map(att => `
                  <li class="attachment-item">
                    📄 ${att.filename}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="action-buttons">
            <a href="mailto:${email}?subject=Re: ${subject}" class="reply-button">
              ↩️ 답장하기
            </a>
          </div>
          
          <div class="timestamp">
            📅 접수 시간: ${new Date().toLocaleString('ko-KR', { 
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <p><strong>반혜나 고객지원팀</strong></p>
            <p>이 이메일은 고객센터 시스템에서 자동으로 발송되었습니다.</p>
            <p>답변은 위 고객 이메일 주소로 직접 보내주세요.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Professional HTML template for user confirmation
  const userEmailHtml = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>문의 접수 완료</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f9fafb;
          padding: 20px;
        }
        .email-container { 
          max-width: 650px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }
        .header { 
          background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        .header-content {
          position: relative;
          z-index: 1;
        }
        .header h1 { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        .content { 
          padding: 40px 30px; 
        }
        .success-banner {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 30px;
          margin: 0 0 30px 0;
          text-align: center;
        }
        .success-banner h2 {
          color: #047857;
          font-size: 24px;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .success-banner p {
          color: #065f46;
          font-size: 16px;
          line-height: 1.6;
        }
        .inquiry-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .summary-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }
        .summary-item {
          margin-bottom: 16px;
        }
        .summary-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .summary-value {
          color: #1f2937;
          font-size: 15px;
          padding: 12px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }
        .message-preview {
          white-space: pre-wrap;
          line-height: 1.7;
          max-height: 120px;
          overflow: hidden;
          position: relative;
        }
        .contact-info {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 24px;
          margin: 30px 0;
        }
        .contact-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        .contact-methods {
          display: grid;
          gap: 12px;
        }
        .contact-method {
          display: flex;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .contact-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          font-size: 16px;
        }
        .response-timeline {
          background: #fefce8;
          border: 1px solid #eab308;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .footer { 
          background: #f9fafb; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb;
        }
        .footer-content {
          color: #6b7280; 
          font-size: 14px;
          line-height: 1.6;
        }
        .brand-signature {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .brand-name {
          color: #1f2937;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <h1>문의 접수 완료</h1>
            <p>반혜나</p>
          </div>
        </div>
        
        <div class="content">
          <div class="success-banner">
            <h2>안녕하세요 ${name}님! 👋</h2>
            <p>소중한 문의를 보내주셔서 진심으로 감사합니다.<br>
            귀하의 문의가 성공적으로 접수되었으며, 빠른 시일 내에 정성껏 답변드리겠습니다.</p>
          </div>
          
          <div class="inquiry-summary">
            <div class="summary-header">
              <h3 style="color: #374151; font-size: 18px; margin: 0;">📋 접수된 문의 내용</h3>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">📝 문의 제목</div>
              <div class="summary-value">${subject}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">💬 문의 내용</div>
              <div class="summary-value">
                <div class="message-preview">${message}</div>
              </div>
            </div>
            
            ${attachments.length > 0 ? `
              <div class="summary-item">
                <div class="summary-label">📎 첨부 파일</div>
                <div class="summary-value">${attachments.length}개의 파일이 첨부되었습니다</div>
              </div>
            ` : ''}
          </div>
          
          <div class="response-timeline">
            <h3 style="color: #a16207; margin: 0 0 12px 0; font-size: 16px;">⏰ 답변 예정 시간</h3>
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              영업일 기준 24-48시간 내에 답변드리겠습니다
            </p>
          </div>
          
          <div class="contact-info">
            <div class="contact-header">
              <h3 style="color: #1e40af; margin: 0; font-size: 18px;">📞 추가 연락 방법</h3>
            </div>
            <p style="color: #1e40af; margin-bottom: 16px; font-size: 14px;">
              급한 문의사항이 있으시면 아래 연락처로 직접 문의해주세요
            </p>
            
            <div class="contact-methods">
              <div class="contact-method">
                <div class="contact-icon">📧</div>
                <div>
                  <strong>이메일:</strong> info.banhannah@gmail.com
                </div>
              </div>
              
              <div class="contact-method">
                <div class="contact-icon">📱</div>
                <div>
                  <strong>Instagram:</strong> @banhanna_h
                </div>
              </div>
              
              <div class="contact-method">
                <div class="contact-icon">💬</div>
                <div>
                  <strong>KakaoTalk:</strong> 오픈채팅방 문의
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="brand-signature">
              <div class="brand-name">반혜나 고객지원팀</div>
              <p>항상 최선을 다해 도움을 드리겠습니다</p>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              이 이메일은 자동으로 발송되었습니다. 답변이 필요하시면 위 연락처로 문의해주세요.
            </p>
          </div>
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