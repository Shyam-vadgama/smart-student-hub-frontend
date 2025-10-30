import { Router } from 'express';
import { submitSolution, runSolution } from '../../controllers/leetcode/submissionController';
import { authMiddleware } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';

const router = Router();

router.post('/:problemId/submit', authMiddleware, checkRole(['student']), submitSolution);
router.post('/:problemId/run', authMiddleware, checkRole(['student']), runSolution);

export default router;
