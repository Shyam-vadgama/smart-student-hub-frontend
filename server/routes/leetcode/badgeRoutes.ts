import { Router } from 'express';
import { getBadge, getLeaderboard } from '../../controllers/leetcode/badgeController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.get('/badge', authMiddleware, getBadge);
router.get('/leaderboard', authMiddleware, getLeaderboard);

export default router;
