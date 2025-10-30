import { Router } from 'express';
import { 
  createProblem, 
  getAllProblems, 
  getProblemById, 
  deleteProblemById,
  getSolvedProblems,
  generateProblem
} from '../../controllers/leetcode/problemController';
import { authMiddleware } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';

const router = Router();

// Public routes
router.get('/', getAllProblems);
router.get('/:id', getProblemById);

// Protected routes
router.post('/create', authMiddleware, checkRole(['faculty', 'hod']), createProblem);
router.post('/generate', authMiddleware, checkRole(['faculty', 'hod']), generateProblem);
router.delete('/:id', authMiddleware, checkRole(['faculty', 'hod']), deleteProblemById);
router.get('/solved/:userId', authMiddleware, getSolvedProblems);

export default router;
