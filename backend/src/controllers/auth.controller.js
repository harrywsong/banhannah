// src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';
import { HTTP_STATUS } from '../config/constants.js';
import { ENV } from '../config/env.js';

/**
 * Register new user
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    
    const result = await authService.registerUser(name, email, password);
    
    res.status(HTTP_STATUS.CREATED).json({
      message: result.emailSent 
        ? '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.' 
        : '회원가입이 완료되었습니다.',
      user: result.user,
      emailSent: result.emailSent
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password);
    
    // Set HTTP-only cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: ENV.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      message: '로그인 성공',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: error.message,
        code: 'EMAIL_NOT_VERIFIED',
        email: error.email
      });
    }
    next(error);
  }
}

/**
 * Logout user
 */
export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: '로그아웃 성공' });
}

/**
 * Get current user
 */
export async function getCurrentUser(req, res) {
  res.json({ user: req.user });
}

/**
 * Verify email
 */
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    
    await authService.verifyEmail(token);
    
    res.json({ message: '이메일 인증이 완료되었습니다.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend verification email
 */
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    
    await authService.resendVerification(email);
    
    res.json({ message: '인증 이메일이 재발송되었습니다.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Update profile
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    
    const result = await authService.updateProfile(req.user.id, name, email);
    
    res.json({
      message: result.emailChanged 
        ? '프로필이 업데이트되었습니다. 새 이메일 주소로 인증 메일이 발송되었습니다.' 
        : '프로필이 업데이트되었습니다.',
      user: result.user,
      emailChanged: result.emailChanged
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's purchases
 */
export async function getMyPurchases(req, res, next) {
  try {
    const { prisma } = await import('../config/database.js');
    
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            price: true,
            discountPrice: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });
    
    res.json({ purchases });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's progress
 */
export async function getMyProgress(req, res, next) {
  try {
    const { prisma } = await import('../config/database.js');
    
    const progress = await prisma.progress.findMany({
      where: { userId: req.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            lessons: true
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });
    
    res.json({ progress });
  } catch (error) {
    next(error);
  }
}