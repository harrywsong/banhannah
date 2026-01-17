// backend/utils/email.js - FIXED VERSION
const nodemailer = require('nodemailer');

// ========== SMTP CONFIGURATION - FIXED ==========
const createTransporter = () => {
  // Check if SMTP credentials are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Emails will be simulated.');
    console.warn('📧 To enable real emails:');
    console.warn('   1. Set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env');
    console.warn('   2. For Gmail: Enable 2FA and create App Password at https://myaccount.google.com/apppasswords');
    console.warn('   3. Use the 16-character App Password (remove spaces) as SMTP_PASS');
    return null;
  }

  // CRITICAL FIX: Remove all spaces from app password
  const cleanPassword = process.env.SMTP_PASS.replace(/\s/g, '');
  
  console.log('✅ SMTP configured with:', process.env.SMTP_HOST, process.env.SMTP_USER);
  console.log('📧 Password length:', cleanPassword.length, 'characters');

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // CRITICAL: Must be false for port 587 (use true for port 465)
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPassword // Use cleaned password without spaces
    },
    // ADDITIONAL FIX: Add these options for better compatibility
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates
      minVersion: 'TLSv1.2'
    },
    // Enable debug output
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });
};

// ========== EMAIL TEMPLATES ==========

// 1. REGISTRATION VERIFICATION EMAIL
const sendVerificationEmail = async (email, token, name) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"반혜나 교육" <noreply@yewon.com>',
    to: email,
    subject: '이메일 인증 - 반혜나 교육 플랫폼',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #0284c7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">✉️ 이메일 인증</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px;">안녕하세요 <strong>${name}</strong>님,</p>
      <p>반혜나 교육 플랫폼에 가입해주셔서 감사합니다!</p>
      <p>아래 버튼을 클릭하여 이메일 주소를 인증하고 계정을 활성화해주세요:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">이메일 인증하기</a>
      </div>
      <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; font-size: 14px;">
        <strong>⏰ 중요:</strong> 이 인증 링크는 <strong>24시간</strong> 동안 유효합니다.
      </p>
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
        <span style="word-break: break-all; font-family: monospace; background: #f3f4f6; padding: 8px; display: inline-block; margin-top: 8px;">${verificationUrl}</span>
      </p>
    </div>
    <div class="footer">
      <p>이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.</p>
      <p>© ${new Date().getFullYear()} 반혜나 교육. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Response:', info.response);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      console.error('📧 Error code:', error.code);
      console.error('📧 Error command:', error.command);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('🔐 Authentication failed. Please check:');
        console.error('   1. SMTP_USER is correct (your Gmail address)');
        console.error('   2. SMTP_PASS is your App Password (16 chars, no spaces)');
        console.error('   3. 2FA is enabled on your Google account');
        console.error('   4. App Password was generated at: https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        console.error('🌐 Connection failed. Please check:');
        console.error('   1. Internet connection is working');
        console.error('   2. Firewall allows outbound SMTP (port 587)');
        console.error('   3. SMTP_HOST is correct (smtp.gmail.com)');
      }
      
      throw new Error(`Email sending failed: ${error.message}`);
    }
  } else {
    // Simulation mode
    console.log('📧 [SIMULATED EMAIL]:');
    console.log(`   To: ${email}`);
    console.log(`   Subject: ${mailOptions.subject}`);
    console.log(`   Verification URL: ${verificationUrl}`);
    console.log('   ⚠️  Configure SMTP to send real emails');
    return false;
  }
};

// 2. EMAIL CHANGE VERIFICATION
const sendEmailChangeVerification = async (email, token, name) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"반혜나 교육" <noreply@yewon.com>',
    to: email,
    subject: '이메일 변경 인증 - 반혜나 교육 플랫폼',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #0284c7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🔄 이메일 변경 인증</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px;">안녕하세요 <strong>${name}</strong>님,</p>
      <p>계정 이메일 변경 요청을 받았습니다.</p>
      <p>새 이메일 주소를 인증하기 위해 아래 버튼을 클릭해주세요:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">새 이메일 인증하기</a>
      </div>
      <div class="warning">
        <strong>🔒 보안 안내:</strong><br>
        • 이메일 변경을 요청하지 않으셨다면 이 이메일을 무시하고 즉시 비밀번호를 변경해주세요.<br>
        • 인증 후에는 새 이메일로 로그인해야 합니다.
      </div>
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
        <span style="word-break: break-all; font-family: monospace; background: #f3f4f6; padding: 8px; display: inline-block; margin-top: 8px;">${verificationUrl}</span>
      </p>
    </div>
    <div class="footer">
      <p>이 요청을 하지 않으셨다면 <strong>즉시</strong> 저희에게 연락주세요.</p>
      <p>© ${new Date().getFullYear()} 반혜나 교육. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
      console.log('📧 Message ID:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  } else {
    // Simulation mode
    console.log('📧 [SIMULATED EMAIL]:');
    console.log(`   To: ${email}`);
    console.log(`   Subject: ${mailOptions.subject}`);
    console.log(`   Verification URL: ${verificationUrl}`);
    return false;
  }
};

// 3. CONTACT FORM EMAIL (to admin + user confirmation)
const sendContactFormEmail = async ({ name, email, subject, message }) => {
  const transporter = createTransporter();
  
  // Email to admin
  const adminEmail = {
    from: process.env.EMAIL_FROM || '"반혜나 교육" <noreply@yewon.com>',
    to: process.env.SMTP_USER || 'hwstestcontact@gmail.com', // Admin email
    replyTo: email, // User's email for easy reply
    subject: `[문의] ${subject}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .field { margin: 15px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; }
    .label { font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase; }
    .value { margin-top: 5px; color: #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">📨 새 문의가 도착했습니다</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">보낸 사람</div>
        <div class="value"><strong>${name}</strong></div>
      </div>
      <div class="field">
        <div class="label">이메일</div>
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">제목</div>
        <div class="value">${subject}</div>
      </div>
      <div class="field">
        <div class="label">메시지</div>
        <div class="value" style="white-space: pre-wrap;">${message}</div>
      </div>
      <div style="margin-top: 30px; padding: 15px; background: #dbeafe; border-radius: 6px;">
        <strong>💡 Tip:</strong> 이 이메일에 바로 답장하면 ${email}로 전송됩니다.
      </div>
    </div>
  </div>
</body>
</html>
    `
  };

  // Confirmation email to user
  const userEmail = {
    from: process.env.EMAIL_FROM || '"반혜나 교육" <noreply@yewon.com>',
    to: email,
    subject: '문의 접수 확인 - 반혜나 교육',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">✅ 문의가 접수되었습니다</h1>
    </div>
    <div class="content">
      <p>안녕하세요 <strong>${name}</strong>님,</p>
      <p>문의해주셔서 감사합니다. 귀하의 문의가 성공적으로 접수되었습니다.</p>
      <div class="summary">
        <h3 style="margin-top: 0; color: #0284c7;">📋 접수된 문의 내용</h3>
        <p><strong>제목:</strong> ${subject}</p>
        <p><strong>메시지:</strong></p>
        <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 6px;">${message}</p>
      </div>
      <p>빠른 시일 내에 답변 드리겠습니다. 일반적으로 1-2 영업일 이내에 회신해 드립니다.</p>
      <p style="margin-top: 30px; padding: 15px; background: #dbeafe; border-radius: 6px; font-size: 14px;">
        <strong>💡 추가 문의사항이 있으신가요?</strong><br>
        이 이메일에 바로 답장하시거나 ${process.env.SMTP_USER || 'hwstestcontact@gmail.com'}으로 연락주세요.
      </p>
    </div>
    <div class="footer">
      <p>최선을 다해 도와드리겠습니다!</p>
      <p>© ${new Date().getFullYear()} 반혜나 교육. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  if (transporter) {
    try {
      // Send admin email
      const adminInfo = await transporter.sendMail(adminEmail);
      console.log('✅ Admin notification sent successfully');
      console.log('📧 Admin Message ID:', adminInfo.messageId);
      
      // Send user confirmation
      const userInfo = await transporter.sendMail(userEmail);
      console.log('✅ User confirmation sent successfully to:', email);
      console.log('📧 User Message ID:', userInfo.messageId);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send contact form emails:', error.message);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  } else {
    // Simulation mode
    console.log('📧 [SIMULATED EMAIL]:');
    console.log(`   Admin notification: ${process.env.SMTP_USER || 'hwstestcontact@gmail.com'}`);
    console.log(`   User confirmation: ${email}`);
    console.log(`   Subject: ${subject}`);
    return false;
  }
};

// 4. PASSWORD RESET EMAIL (Future feature)
const sendPasswordResetEmail = async (email, token, name) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"반혜나 교육" <noreply@yewon.com>',
    to: email,
    subject: '비밀번호 재설정 - 반혜나 교육',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🔐 비밀번호 재설정</h1>
    </div>
    <div class="content">
      <p>안녕하세요 <strong>${name}</strong>님,</p>
      <p>비밀번호 재설정 요청을 받았습니다.</p>
      <p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
      </div>
      <div class="warning">
        <strong>⚠️ 보안 안내:</strong><br>
        • 이 링크는 <strong>1시간</strong> 동안만 유효합니다.<br>
        • 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.<br>
        • 계정 보안이 걱정되시면 즉시 저희에게 연락주세요.
      </div>
    </div>
    <div class="footer">
      <p>계정 보안을 위해 비밀번호를 정기적으로 변경하는 것을 권장합니다.</p>
      <p>© ${new Date().getFullYear()} 반혜나 교육. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  if (transporter) {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    console.log('📧 Message ID:', info.messageId);
  } else {
    console.log('📧 [SIMULATED] Password reset email:');
    console.log(`   To: ${email}`);
    console.log(`   Reset URL: ${resetUrl}`);
  }
};

module.exports = {
  sendVerificationEmail,
  sendEmailChangeVerification,
  sendContactFormEmail,
  sendPasswordResetEmail
};