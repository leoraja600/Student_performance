import jwt from 'jsonwebtoken';
import { config } from '../utils/config.js';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { student: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    logger.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export const requireFaculty = (req, res, next) => {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Faculty or Admin access required' });
  }
  next();
};

export const requireFacultyOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Faculty or Admin access required' });
  }
  next();
};

export const requireStudentOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

/**
 * Middleware to allow admin to access any resource,
 * but students can only access their own resources
 */
export const requireOwnerOrAdmin = (studentIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    // Admin, Faculty, and any authenticated GET request for student data is allowed
    if (req.user.role === 'ADMIN' || req.user.role === 'FACULTY' || req.method === 'GET') {
      return next();
    }
    // Students can only access their own data
    const requestedId = req.params[studentIdParam];
    if (req.user.studentId && req.user.studentId === requestedId) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'You can only access your own data [OWNER_RESTRICTED]',
    });
  };
};
