import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { registerSchema, loginSchema } from '../schemas/authSchema.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user account (Nama Lengkap, Email, Password, Konfirmasi Password)
 * @access  Public
 */
router.post('/register', validateRequest({ body: registerSchema }), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user login (Email, Password)
 * @access  Public
 */
router.post('/login', validateRequest({ body: loginSchema }), login);

export default router;
