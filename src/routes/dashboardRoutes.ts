import { Router } from 'express';
import { getDailyDashboard } from '../controllers/dashboardController.js';
import { verifyAuth } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route   GET /api/v1/dashboard/daily
 * @desc    Fetch daily therapy dashboard summary, missions, and weekly progress
 * @access  Private (Bearer Supabase JWT)
 */
router.get(
  '/daily',
  verifyAuth,
  getDailyDashboard
);

export default router;
