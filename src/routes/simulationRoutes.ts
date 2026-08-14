import { Router } from 'express';
import {
  getScenarios,
  startSimulation,
  processSimulationTurn,
  endSimulation,
} from '../controllers/simulationController.js';
import { verifyAuth } from '../middlewares/authMiddleware.js';
import { uploadAudioSingle } from '../middlewares/uploadMiddleware.js';

const router = Router();

/**
 * @route   GET /api/v1/simulations/scenarios
 * @desc    Get master virtual exposure scenarios catalogue
 * @access  Private (Bearer Supabase JWT)
 */
router.get('/scenarios', verifyAuth, getScenarios);

/**
 * @route   POST /api/v1/simulations/start
 * @desc    Initialize a virtual exposure roleplay session
 * @access  Private (Bearer Supabase JWT)
 */
router.post('/start', verifyAuth, startSimulation);

/**
 * @route   POST /api/v1/simulations/:simulationId/turn
 * @desc    Submit user speech audio, transcribe via Google STT, upload to Supabase Storage, and get Claude AI response
 * @access  Private (Bearer Supabase JWT)
 */
router.post(
  '/:simulationId/turn',
  verifyAuth,
  uploadAudioSingle,
  processSimulationTurn
);

/**
 * @route   POST /api/v1/simulations/:simulationId/end
 * @desc    Conclude simulation session and generate CBT summary evaluation
 * @access  Private (Bearer Supabase JWT)
 */
router.post('/:simulationId/end', verifyAuth, endSimulation);

export default router;
