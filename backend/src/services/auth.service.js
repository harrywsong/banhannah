// src/services/auth.service.js - Authentication business logic
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.js';
import { generateToken } from '../utils/helpers.js';
import { sendVerificationEmail, sendEmailChangeVerification } from './email.service.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../config/constants.js';

/**
 * Generate JWT token
 */
export function generateJWT(userId) {
  return jwt.sign(
    { userId },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Register new user
 */
export async function registerUser(name, email, password) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate verification token
  const verificationToken = generateToken();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: ROLES.STUDENT,
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
    emailSent = true;
    logger.info(`Verification email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }

  return { user, emailSent };
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if email is verified
  if (!user.emailVerified) {
    const error = new Error('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
    error.code = 'EMAIL_NOT_VERIFIED';
    error.email = user.email;
    throw error;
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateJWT(user.id);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Verify email
 */
export async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      tokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new Error('유효하지 않거나 만료된 인증 링크입니다.');
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

  return true;
}

/**
 * Resend verification email
 */
export async function resendVerification(email) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  if (user.emailVerified) {
    throw new Error('이미 인증된 계정입니다.');
  }

  // Generate new token
  const verificationToken = generateToken();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      tokenExpiry
    }
  });

  // Send email
  await sendVerificationEmail(email, verificationToken, user.name);

  return true;
}

/**
 * Update user profile
 */
export async function updateProfile(userId, name, email) {
  const updateData = {};

  if (name) {
    updateData.name = name;
  }

  // Check if email is being changed
  let emailChanged = false;
  if (email) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (email !== user.email) {
      // Check if new email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }

      // Generate verification token
      const verificationToken = generateToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      updateData.email = email;
      updateData.emailVerified = false;
      updateData.verificationToken = verificationToken;
      updateData.tokenExpiry = tokenExpiry;
      emailChanged = true;

      // Send verification email
      try {
        await sendEmailChangeVerification(email, verificationToken, name || user.name);
        logger.info(`Email change verification sent to: ${email}`);
      } catch (error) {
        logger.error('Failed to send verification email:', error);
      }
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true
    }
  });

  return { user: updatedUser, emailChanged };
}

/**
 * Change password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return true;
}

/**
 * Initialize admin user on startup
 */
export async function initializeAdmin() {
  try {
    const adminEmail = ENV.ADMIN_EMAIL;
    const adminPassword = ENV.ADMIN_PASSWORD;
    const adminName = ENV.ADMIN_NAME;

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: ROLES.ADMIN,
          emailVerified: true
        }
      });
      logger.info(`✓ Admin user created: ${adminEmail}`);
      logger.warn('⚠️  IMPORTANT: Change admin password in production!');
    } else {
      // Update admin credentials from env
      const hashedPassword = await hashPassword(adminPassword);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          role: ROLES.ADMIN,
          name: adminName,
          emailVerified: true
        }
      });
      logger.info(`✓ Admin user updated: ${adminEmail}`);
    }
  } catch (error) {
    logger.error('Failed to initialize admin:', error);
  }
}