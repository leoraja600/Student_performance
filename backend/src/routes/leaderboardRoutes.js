import { Router } from 'express';
import {
  getLeaderboard,
  triggerSync,
  getSystemStats,
  getAllLogs,
  getOverallAnalytics,
  getSettings,
  updateSettings,
  getClassTrends,
  getInterventionList,
  getSystemHealth,
} from '../controllers/leaderboardController.js';
import { authenticate, requireFacultyOrAdmin, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get sorted leaderboard of all students
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 */
router.get('/leaderboard', authenticate, getLeaderboard);

/**
 * @swagger
 * /api/admin/sync:
 *   post:
 *     summary: Trigger a full data sync for all students (admin)
 *     tags: [Admin, Faculty]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin/sync', authenticate, requireFacultyOrAdmin, triggerSync);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get system stats for admin dashboard
 *     tags: [Admin, Faculty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/stats', authenticate, requireFacultyOrAdmin, getSystemStats);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get all fetch logs (admin)
 *     tags: [Admin, Faculty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/logs', authenticate, requireFacultyOrAdmin, getAllLogs);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get aggregate performance analytics for all students
 *     tags: [Admin, Faculty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/analytics', authenticate, requireFacultyOrAdmin, getOverallAnalytics);
router.get('/admin/trends', authenticate, requireFacultyOrAdmin, getClassTrends);
router.get('/admin/interventions', authenticate, requireFacultyOrAdmin, getInterventionList);

router.get('/admin/settings', authenticate, requireAdmin, getSettings);
router.put('/admin/settings/:key', authenticate, requireAdmin, updateSettings);
router.get('/admin/health', authenticate, requireAdmin, getSystemHealth);

export default router;
