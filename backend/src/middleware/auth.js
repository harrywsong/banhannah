// src/middleware/auth.js - Authentication middleware
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { prisma } from '../config/database.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../config/constants.js';

/**
 * Authenticate user from JWT token
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: ERROR_MESSAGES.UNAUTHORIZED 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: 'Token expired' 
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.INTERNAL_ERROR 
    });
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED 
    });
  }

  if (req.user.role !== ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ 
      error: ERROR_MESSAGES.FORBIDDEN 
    });
  }

  next();
}

/**
 * Optional authentication (don't fail if no token)
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}