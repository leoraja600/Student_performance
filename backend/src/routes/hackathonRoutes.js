import { Router } from 'express';
import {
  createHackathon,
  getMyHackathons,
  updateHackathon,
  deleteHackathon,
  getPendingHackathons,
  verifyHackathon,
  getStudentHackathons,
} from '../controllers/hackathonController.js';
import { authenticate, requireAdmin, requireFacultyOrAdmin } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================
// Student Routes
// =============================================

// Get my hackathon submissions
router.get('/my', getMyHackathons);

// Submit a new hackathon
router.post('/', createHackathon);

// Update a hackathon entry (student can only edit PENDING/REJECTED)
router.put('/:id', updateHackathon);

// Delete a hackathon entry
router.delete('/:id', deleteHackathon);

// =============================================
// Admin/Faculty Routes
// =============================================

// Get all pending hackathons for review
router.get('/admin/pending', requireFacultyOrAdmin, getPendingHackathons);

// Verify or reject a hackathon
router.put('/admin/:id/verify', requireFacultyOrAdmin, verifyHackathon);

// Get hackathons for a specific student
router.get('/student/:studentId', requireFacultyOrAdmin, getStudentHackathons);

export default router;
