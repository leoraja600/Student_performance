import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const loginId = email.toLowerCase().trim();

    // Find user by email or by roll number (if student)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { student: { rollNumber: { equals: loginId } } }
        ]
      },
      include: { student: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let isValid = await bcrypt.compare(password, user.password);
    
    // Fallback for students: try case-insensitive roll number password
    if (!isValid && user.role === 'STUDENT') {
      isValid = await bcrypt.compare(password.toLowerCase(), user.password);
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`[Auth] User logged in: ${user.email} (${user.role})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        student: user.student,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        studentId: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            leetcodeUsername: true,
            hackerrankUsername: true,
          }
        },
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
