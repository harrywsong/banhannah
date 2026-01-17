const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendVerificationEmail = async (email, token, name) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '이메일 인증 - 반혜나 교육 플랫폼',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>이메일 인증</h2>
        <p>안녕하세요 ${name}님,</p>
        <p>반혜나 교육 플랫폼에 가입해주셔서 감사합니다.</p>
        <p>아래 버튼을 클릭하여 이메일을 인증해주세요:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #0284c7; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            이메일 인증하기
          </a>
        </div>
        <p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendEmailChangeVerification = async (email, token, name) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email-change?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '이메일 변경 인증 - 반혜나 교육 플랫폼',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>이메일 변경 인증</h2>
        <p>안녕하세요 ${name}님,</p>
        <p>이메일 변경 요청을 받았습니다.</p>
        <p>아래 버튼을 클릭하여 새 이메일을 인증해주세요:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #0284c7; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            이메일 인증하기
          </a>
        </div>
        <p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          이 요청을 하지 않으셨다면 즉시 저희에게 연락주세요.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendEmailChangeVerification
};