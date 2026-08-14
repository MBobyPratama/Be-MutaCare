import { Router } from 'express';
import { submitMoodCheckIn } from '../controllers/moodController.js';
import { verifyAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createMoodCheckInSchema } from '../schemas/moodSchema.js';

const router = Router();

/**
 * @route   POST /api/v1/moods/check-in
 * @desc    Submit daily mood & anxiety check-in, get adaptive AI companion message
 * @access  Private (Bearer Supabase JWT)
 */
router.post(
  '/check-in',
  verifyAuth,
  validateRequest({ body: createMoodCheckInSchema }),
  submitMoodCheckIn
);

export default router;
