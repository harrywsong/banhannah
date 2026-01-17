const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { sendVerificationEmail, sendEmailChangeVerification } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user (not verified yet)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'STUDENT',
        emailVerified: false,
        verificationToken,
        tokenExpiry
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail(email, verificationToken, name);
      console.log('✅ Verification email sent to:', email);
      emailSent = true;
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      console.error('Error details:', emailError.message);
      // Continue registration even if email fails
      console.warn('⚠️ User registered but verification email failed');
      console.warn('💡 Check SMTP configuration in backend/.env');
    }

    res.status(201).json({
      success: true,
      user,
      emailSent,
      message: emailSent 
        ? '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 인증해주세요.'
        : '회원가입이 완료되었습니다. 이메일 전송에 실패했지만 관리자에게 문의하여 계정을 인증할 수 있습니다.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 인증 링크입니다.' });
    }

    // Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null
      }
    });

    res.json({ 
      success: true, 
      message: '이메일이 성공적으로 인증되었습니다. 이제 로그인할 수 있습니다.' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: '이메일 인증에 실패했습니다.' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: '이미 인증된 계정입니다.' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        tokenExpiry
      }
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken, user.name);

    res.json({ 
      success: true, 
      message: '인증 이메일이 재전송되었습니다.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: '인증 이메일 재전송에 실패했습니다.' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ========== IMPROVED: Update user profile ==========
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: '이름과 이메일은 필수 항목입니다.' });
    }
    
    // Build update data object
    const updateData = {};
    if (name && name !== req.user.name) {
      updateData.name = name;
    }
    
    // Check if email is being changed
    let emailChanged = false;
    if (email && email !== req.user.email) {
      // Verify new email is not already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
      }
      
      // Generate verification token for new email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      updateData.email = email;
      updateData.emailVerified = false;
      updateData.verificationToken = verificationToken;
      updateData.tokenExpiry = tokenExpiry;
      emailChanged = true;
      
      // Send verification email to NEW email address
      try {
        await sendEmailChangeVerification(email, verificationToken, name || req.user.name);
        console.log('✅ Email change verification sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Continue with update but warn user
        console.warn('⚠️ Email update will proceed but verification email failed to send');
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.json({ 
        success: true, 
        message: '변경사항이 없습니다.',
        user: req.user
      });
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    if (emailChanged) {
      // Log out user - they need to verify new email
      res.clearCookie('token');
      res.json({ 
        success: true, 
        emailChanged: true,
        message: '새 이메일로 인증 링크가 전송되었습니다. 이메일을 확인하고 인증 후 다시 로그인해주세요.',
        requiresRelogin: true
      });
    } else {
      // Generate new token with updated user info
      const newToken = generateToken(updatedUser.id);
      
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({ 
        success: true, 
        emailChanged: false,
        user: updatedUser,
        token: newToken,
        message: '프로필이 성공적으로 업데이트되었습니다.'
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '프로필 업데이트에 실패했습니다. 다시 시도해주세요.' });
  }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;