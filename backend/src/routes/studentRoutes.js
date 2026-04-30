import { Router } from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  refreshStudent,
  getStudentHistory,
  getStudentLogs,
  updateWeeklyGoal,
  updateProfile,
  getStudentAchievements,
} from '../controllers/studentController.js';
import { authenticate, requireAdmin, requireFacultyOrAdmin, requireOwnerOrAdmin, requireStudentOrAdmin } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students (admin only)
 *     tags: [Students, Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of students with pagination
 */
router.get('/', authenticate, getStudents);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get single student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, getStudent);

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student (admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAdmin, createStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update a student (admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAdmin, updateStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Deactivate a student (admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAdmin, deleteStudent);

/**
 * @swagger
 * /api/refresh/{studentId}:
 *   post:
 *     summary: Trigger manual data refresh for a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post('/refresh/:studentId', requireOwnerOrAdmin('studentId'), refreshStudent);

/**
 * @swagger
 * /api/students/{id}/history:
 *   get:
 *     summary: Get historical snapshots for a student (for chart)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/goal', requireOwnerOrAdmin('id'), updateWeeklyGoal);
router.put('/:id/profile', requireOwnerOrAdmin('id'), updateProfile);
router.get('/:id/history', authenticate, getStudentHistory);
router.get('/:id/achievements', authenticate, getStudentAchievements);

export default router;
