import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { verifyLeetcodeUsername } from '../services/leetcodeFetcher.js';
import { verifyHackerrankUsername } from '../services/hackerrankScraper.js';
import { fetchAndStoreStudentData } from '../services/dataSync.js';

/**
 * GET /api/students - Admin: list all, Student: own profile
 */
export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { rollNumber: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
        include: {
          snapshots: {
            orderBy: { fetchedAt: 'desc' },
            take: 30, // Include more snapshots to calculate weekly progress if needed in frontend
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Calculate weekly progress for each student
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const studentsWithWeeklyProgress = students.map(s => {
      const latest = s.snapshots[0];
      const weekOldSnapshot = s.snapshots.find(snap => new Date(snap.fetchedAt) <= sevenDaysAgo) || s.snapshots[s.snapshots.length - 1];
      
      const weeklyLeetcodeProgress = latest && weekOldSnapshot 
        ? Math.max(0, latest.leetcodeTotalSolved - weekOldSnapshot.leetcodeTotalSolved)
        : 0;

      return {
        ...s,
        weeklyLeetcodeProgress,
        // Only return the latest snapshot to keep response size down for list
        snapshots: latest ? [latest] : []
      };
    });

    res.json({
      success: true,
      data: studentsWithWeeklyProgress,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id - Get single student with latest snapshot
 */
export const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        snapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 30, // last 30 snapshots for history chart
        },
        fetchLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Calculate weekly progress
    const snapshots = student.snapshots;
    const latest = snapshots[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weekOldSnapshot = snapshots.find(snap => new Date(snap.fetchedAt) <= sevenDaysAgo) || snapshots[snapshots.length - 1];
    
    const weeklyLeetcodeProgress = latest && weekOldSnapshot 
      ? Math.max(0, latest.leetcodeTotalSolved - weekOldSnapshot.leetcodeTotalSolved)
      : 0;

    res.json({ 
      success: true, 
      data: { 
        ...student, 
        weeklyLeetcodeProgress 
      } 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students - Admin: create student
 */
export const createStudent = async (req, res, next) => {
  try {
    const { rollNumber, name, email, leetcodeUsername, hackerrankUsername, hackathonCount, password, validateUsernames } = req.body;

    if (!rollNumber || !name || !email || !leetcodeUsername || !hackerrankUsername || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required: rollNumber, name, email, leetcodeUsername, hackerrankUsername, password' });
    }

    // Optional username validation
    if (validateUsernames === true || validateUsernames === 'true') {
      logger.info(`[Students] Validating usernames for: ${name}`);

      const [lcValid, hrValid] = await Promise.all([
        verifyLeetcodeUsername(leetcodeUsername),
        verifyHackerrankUsername(hackerrankUsername),
      ]);

      if (!lcValid) {
        return res.status(400).json({ success: false, message: `LeetCode username "${leetcodeUsername}" does not exist` });
      }
      if (!hrValid) {
        return res.status(400).json({ success: false, message: `HackerRank username "${hackerrankUsername}" does not exist` });
      }
    }

    // Extract usernames if links provided
    let finalLC = leetcodeUsername;
    if (finalLC && finalLC.includes('leetcode.com')) {
      const match = finalLC.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/);
      if (match) finalLC = match[1];
    }
    
    let finalHR = hackerrankUsername;
    if (finalHR && finalHR.includes('hackerrank.com')) {
      const match = finalHR.match(/hackerrank\.com\/(?:profile\/|u\/|profiles\/)?([^/?#\s]+)/i);
      if (match) finalHR = match[1];
    }

    const hashedPassword = await bcrypt.hash(password || rollNumber.toString(), 12);

    // Create student and linked user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          rollNumber: rollNumber.toLowerCase().trim(),
          name,
          email: email.toLowerCase().trim(),
          leetcodeUsername: finalLC,
          hackerrankUsername: finalHR,
          hackathonCount: parseInt(hackathonCount || 0),
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'STUDENT',
          studentId: student.id,
        },
      });

      return { student, user };
    });

    logger.info(`[Students] Created student: ${name} (${rollNumber})`);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        id: result.student.id,
        rollNumber: result.student.rollNumber,
        name: result.student.name,
        email: result.student.email,
        leetcodeUsername: result.student.leetcodeUsername,
        hackerrankUsername: result.student.hackerrankUsername,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:id - Admin: update student
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rollNumber, name, email, leetcodeUsername, hackerrankUsername, hackathonCount, isActive } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Extract usernames if links provided
    let finalLC = leetcodeUsername;
    if (finalLC && finalLC.includes('leetcode.com')) {
      const match = finalLC.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/);
      if (match) finalLC = match[1];
    }
    
    let finalHR = hackerrankUsername;
    if (finalHR && finalHR.includes('hackerrank.com')) {
      const match = finalHR.match(/hackerrank\.com\/(?:profile\/|u\/|profiles\/)?([^/?#\s]+)/i);
      if (match) finalHR = match[1];
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...(rollNumber && { rollNumber: rollNumber.toLowerCase().trim() }),
        ...(name && { name }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(finalLC && { leetcodeUsername: finalLC }),
        ...(finalHR && { hackerrankUsername: finalHR }),
        ...(hackathonCount !== undefined && { hackathonCount: parseInt(hackathonCount) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Update user email if changed
    if (email && email.toLowerCase().trim() !== student.email) {
      await prisma.user.updateMany({
        where: { studentId: id },
        data: { email: email.toLowerCase().trim() },
      });
    }

    res.json({ success: true, message: 'Student updated', data: updatedStudent });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/students/:id - Admin: soft delete
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Soft delete
    await prisma.student.update({ where: { id }, data: { isActive: false } });

    logger.info(`[Students] Soft-deleted student: ${student.name}`);
    res.json({ success: true, message: 'Student deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/refresh/:studentId - Trigger manual data refresh
 */
export const refreshStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    logger.info(`[Students] Manual refresh triggered for: ${student.name}`);

    const snapshot = await fetchAndStoreStudentData(studentId);

    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:id/goal - Student: update weekly goal
 */
export const updateWeeklyGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { goal } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: { weeklyGoal: parseInt(goal) },
    });

    res.status(200).json({ success: true, data: { weeklyGoal: student.weeklyGoal } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id/history - Get historical snapshots for charts
 */
export const getStudentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 30 } = req.query;

    const snapshots = await prisma.performanceSnapshot.findMany({
      where: { studentId: id },
      orderBy: { fetchedAt: 'asc' },
      take: parseInt(limit),
    });

    res.json({ success: true, data: snapshots });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id/logs - Get fetch logs for a student
 */
export const getStudentLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const logs = await prisma.fetchLog.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id/achievements - Student: Get badges, streaks, and class benchmarks
 */
export const getStudentAchievements = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [student, allSnapshots] = await Promise.all([
      prisma.student.findUnique({
        where: { id },
        include: { snapshots: { orderBy: { fetchedAt: 'desc' } } },
      }),
      prisma.performanceSnapshot.findMany({
        distinct: ['studentId'],
        orderBy: { fetchedAt: 'desc' },
      }),
    ]);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const snapshots = student.snapshots;
    const latest = snapshots[0] || {};
    
    // 1. Calculate Badges
    const badges = [];
    if (latest.leetcodeHardSolved >= 10) badges.push({ id: 'hard-slayer', name: 'Hard Slayer', icon: '🔥', desc: 'Solved 10+ Hard' });
    if (latest.leetcodeTotalSolved >= 100) badges.push({ id: 'century', name: 'LeetCode 100', icon: '💯', desc: '100+ LC Solves' });
    if (latest.combinedScore >= 75) badges.push({ id: 'job-ready', name: 'Job Ready', icon: '💼', desc: 'Score > 75' });
    if (snapshots.length >= 7) {
      badges.push({ id: 'weekly-warrior', name: 'Weekly Warrior', icon: '🛡️', desc: 'Consistent for a week' });
    }

    // 2. Calculate Streaks (simplified: count unique days in snapshots)
    const uniqueDays = new Set(snapshots.map(s => new Date(s.fetchedAt).toDateString()));
    const streak = uniqueDays.size;

    // 3. Class Benchmarks (Ghost Mode)
    const totalStudents = allSnapshots.length || 1;
    const classAverages = {
      leetcode: allSnapshots.reduce((acc, s) => acc + s.leetcodeTotalSolved, 0) / totalStudents,
      hackerrank: allSnapshots.reduce((acc, s) => acc + s.hackerrankTotalSolved, 0) / totalStudents,
      score: allSnapshots.reduce((acc, s) => acc + s.combinedScore, 0) / totalStudents,
    };

    // 4. Weekly LeetCode Progress
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekOldSnapshot = snapshots.find(snap => new Date(snap.fetchedAt) <= sevenDaysAgo) || snapshots[snapshots.length - 1];
    const weeklyLeetcodeProgress = latest && weekOldSnapshot 
      ? Math.max(0, latest.leetcodeTotalSolved - weekOldSnapshot.leetcodeTotalSolved)
      : 0;

    res.json({
      success: true,
      data: {
        badges,
        streak,
        weeklyLeetcodeProgress,
        benchmarks: {
          user: { 
            leetcode: latest.leetcodeTotalSolved || 0, 
            hackerrank: latest.hackerrankTotalSolved || 0,
            score: latest.combinedScore || 0 
          },
          average: classAverages,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
