import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'hackathons');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Points awarded based on position
const POSITION_SCORES = {
  WINNER: 10,
  RUNNER_UP: 7,
  TOP_5: 5,
  PARTICIPANT: 3,
};

/**
 * POST /api/hackathons — Student submits a new hackathon entry
 */
export const createHackathon = async (req, res, next) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only students can submit hackathons' });
    }

    const { eventName, organizer, position, date, description, teamSize } = req.body;

    if (!eventName || !date) {
      return res.status(400).json({ success: false, message: 'Event name and date are required' });
    }

    const validPositions = Object.keys(POSITION_SCORES);
    const pos = (position || 'PARTICIPANT').toUpperCase();
    if (!validPositions.includes(pos)) {
      return res.status(400).json({ success: false, message: `Position must be one of: ${validPositions.join(', ')}` });
    }

    // Handle file upload
    let proofUrl = null;
    if (req.files && req.files.proof) {
      const file = req.files.proof;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Proof must be an image (JPEG, PNG, WebP) or PDF' });
      }
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Proof file must be under 5MB' });
      }

      const ext = path.extname(file.name);
      const filename = `${studentId}_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await file.mv(filepath);
      proofUrl = `/uploads/hackathons/${filename}`;
    }

    const hackathon = await prisma.hackathon.create({
      data: {
        studentId,
        eventName: eventName.trim(),
        organizer: organizer?.trim() || null,
        position: pos,
        date: new Date(date),
        description: description?.trim() || null,
        proofUrl,
        teamSize: parseInt(teamSize) || 1,
        status: 'PENDING',
        isVerified: false,
      },
    });

    // Update the student's hackathonCount
    const count = await prisma.hackathon.count({ where: { studentId } });
    await prisma.student.update({ where: { id: studentId }, data: { hackathonCount: count } });

    logger.info(`[Hackathons] Student ${studentId} submitted hackathon: ${eventName}`);

    res.status(201).json({ success: true, message: 'Hackathon submitted for review', data: hackathon });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hackathons/my — Student gets their own hackathon entries
 */
export const getMyHackathons = async (req, res, next) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only students can view their hackathons' });
    }

    const hackathons = await prisma.hackathon.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    // Calculate total verified score
    const verifiedHackathons = hackathons.filter(h => h.status === 'VERIFIED');
    const totalScore = verifiedHackathons.reduce((sum, h) => sum + (POSITION_SCORES[h.position] || 0), 0);

    res.json({
      success: true,
      data: {
        hackathons,
        stats: {
          total: hackathons.length,
          verified: verifiedHackathons.length,
          pending: hackathons.filter(h => h.status === 'PENDING').length,
          rejected: hackathons.filter(h => h.status === 'REJECTED').length,
          totalScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/hackathons/:id — Student updates their hackathon entry (only if PENDING)
 */
export const updateHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.studentId;

    const hackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }
    if (hackathon.studentId !== studentId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You can only edit your own entries' });
    }
    if (hackathon.status === 'VERIFIED' && req.user.role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot edit a verified entry' });
    }

    const { eventName, organizer, position, date, description, teamSize } = req.body;

    // Handle new file upload
    let proofUrl = hackathon.proofUrl;
    if (req.files && req.files.proof) {
      const file = req.files.proof;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Proof must be an image (JPEG, PNG, WebP) or PDF' });
      }
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Proof file must be under 5MB' });
      }

      // Delete old file if exists
      if (hackathon.proofUrl) {
        const oldPath = path.join(__dirname, '..', '..', hackathon.proofUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const ext = path.extname(file.name);
      const filename = `${studentId}_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await file.mv(filepath);
      proofUrl = `/uploads/hackathons/${filename}`;
    }

    const validPositions = Object.keys(POSITION_SCORES);
    const pos = position ? position.toUpperCase() : hackathon.position;

    const updated = await prisma.hackathon.update({
      where: { id },
      data: {
        ...(eventName && { eventName: eventName.trim() }),
        ...(organizer !== undefined && { organizer: organizer?.trim() || null }),
        ...(position && validPositions.includes(pos) && { position: pos }),
        ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(teamSize && { teamSize: parseInt(teamSize) }),
        proofUrl,
        // Re-submit for review if student edits a rejected entry
        ...(hackathon.status === 'REJECTED' && { status: 'PENDING', rejectionReason: null }),
      },
    });

    res.json({ success: true, message: 'Hackathon updated', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/hackathons/:id — Student deletes their entry (only if PENDING/REJECTED)
 */
export const deleteHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.studentId;

    const hackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }
    if (hackathon.studentId !== studentId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You can only delete your own entries' });
    }
    if (hackathon.status === 'VERIFIED' && req.user.role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot delete a verified entry. Contact admin.' });
    }

    // Delete proof file
    if (hackathon.proofUrl) {
      const filePath = path.join(__dirname, '..', '..', hackathon.proofUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.hackathon.delete({ where: { id } });

    // Update hackathonCount
    const count = await prisma.hackathon.count({ where: { studentId: hackathon.studentId } });
    await prisma.student.update({ where: { id: hackathon.studentId }, data: { hackathonCount: count } });

    res.json({ success: true, message: 'Hackathon deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hackathons/admin/pending — Admin gets all pending hackathons for review
 */
export const getPendingHackathons = async (req, res, next) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status !== 'ALL') where.status = status;

    const [hackathons, total] = await Promise.all([
      prisma.hackathon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          student: {
            select: { id: true, name: true, rollNumber: true, email: true },
          },
        },
      }),
      prisma.hackathon.count({ where }),
    ]);

    res.json({
      success: true,
      data: hackathons,
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
 * PUT /api/hackathons/admin/:id/verify — Admin verifies a hackathon entry
 */
export const verifyHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'VERIFY' or 'REJECT'

    const hackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    if (action === 'VERIFY') {
      const score = POSITION_SCORES[hackathon.position] || 0;
      await prisma.hackathon.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user.id,
          rejectionReason: null,
        },
      });

      logger.info(`[Hackathons] Admin verified hackathon ${id} for student ${hackathon.studentId}, score: ${score}`);
    } else if (action === 'REJECT') {
      await prisma.hackathon.update({
        where: { id },
        data: {
          status: 'REJECTED',
          isVerified: false,
          rejectionReason: rejectionReason || 'Insufficient proof',
          verifiedBy: req.user.id,
        },
      });

      logger.info(`[Hackathons] Admin rejected hackathon ${id}: ${rejectionReason}`);
    } else {
      return res.status(400).json({ success: false, message: 'Action must be VERIFY or REJECT' });
    }

    // Recalculate verified hackathon score for the student
    const verifiedHackathons = await prisma.hackathon.findMany({
      where: { studentId: hackathon.studentId, status: 'VERIFIED' },
    });
    const totalHackathonScore = verifiedHackathons.reduce((sum, h) => sum + (POSITION_SCORES[h.position] || 0), 0);

    // Update student hackathonCount with verified count
    await prisma.student.update({
      where: { id: hackathon.studentId },
      data: { hackathonCount: verifiedHackathons.length },
    });

    res.json({
      success: true,
      message: action === 'VERIFY' ? 'Hackathon verified' : 'Hackathon rejected',
      data: { totalHackathonScore, verifiedCount: verifiedHackathons.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hackathons/student/:studentId — Get hackathons for a specific student (admin/faculty view)
 */
export const getStudentHackathons = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const hackathons = await prisma.hackathon.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    const verifiedHackathons = hackathons.filter(h => h.status === 'VERIFIED');
    const totalScore = verifiedHackathons.reduce((sum, h) => sum + (POSITION_SCORES[h.position] || 0), 0);

    res.json({
      success: true,
      data: {
        hackathons,
        stats: {
          total: hackathons.length,
          verified: verifiedHackathons.length,
          pending: hackathons.filter(h => h.status === 'PENDING').length,
          rejected: hackathons.filter(h => h.status === 'REJECTED').length,
          totalScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export { POSITION_SCORES };
