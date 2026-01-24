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
export async function sendContactFormEmail({ name, email, subject, message }) {
  const transporter = createTransporter();

  // Email to admin
  const adminEmail = {
    from: ENV.EMAIL_FROM,
    to: ENV.SMTP_USER,
    replyTo: email,
    subject: `[문의] ${subject}`,
    html: `
      <h2>새 문의가 도착했습니다</h2>
      <p><strong>보낸 사람:</strong> ${name}</p>
      <p><strong>이메일:</strong> ${email}</p>
      <p><strong>제목:</strong> ${subject}</p>
      <p><strong>메시지:</strong></p>
      <p>${message}</p>
    `
  };

  // Confirmation to user
  const userEmail = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: '문의 접수 확인',
    html: `
      <h2>문의가 접수되었습니다</h2>
      <p>안녕하세요 <strong>${name}</strong>님,</p>
      <p>문의해주셔서 감사합니다. 빠른 시일 내에 답변 드리겠습니다.</p>
      <hr>
      <p><strong>제목:</strong> ${subject}</p>
      <p><strong>메시지:</strong></p>
      <p>${message}</p>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(adminEmail);
      await transporter.sendMail(userEmail);
      return true;
    } catch (error) {
      logger.error('Contact form email failed:', error);
      throw error;
    }
  } else {
    logger.info(`📧 [SIMULATED] Contact form from: ${email}`);
    return false;
  }
}