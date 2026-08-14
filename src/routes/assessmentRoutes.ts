import { Router } from 'express';
import { submitInitialAssessment } from '../controllers/assessmentController.js';
import { verifyAuth } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createAssessmentSchema } from '../schemas/assessmentSchema.js';

const router = Router();

/**
 * @route   POST /api/v1/assessments
 * @desc    Submit initial assessment, generate AI therapy plan & analysis
 * @access  Private (Bearer Supabase JWT)
 */
router.post(
  '/',
  verifyAuth,
  validateRequest({ body: createAssessmentSchema }),
  submitInitialAssessment
);

export default router;
