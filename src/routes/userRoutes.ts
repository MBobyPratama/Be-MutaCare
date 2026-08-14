import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { verifyAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { updateProfileSchema } from '../schemas/authSchema.js';

const router = Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Get authenticated user profile & assessment completion state
 * @access  Private (Bearer Supabase JWT)
 */
router.get('/me', verifyAuth, getProfile);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update authenticated user profile
 * @access  Private (Bearer Supabase JWT)
 */
router.patch(
  '/me',
  verifyAuth,
  validateRequest({ body: updateProfileSchema }),
  updateProfile
);

export default router;
