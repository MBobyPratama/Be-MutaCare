import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

/**
 * Mandatory Supabase JWT Authentication Middleware.
 * Extracts Bearer JWT token from Authorization header, validates it using Supabase Auth API,
 * and attaches the authenticated user object to `req.user` and token to `req.token`.
 * 
 * Throws AppError.unauthorized if the token is missing, invalid, or expired.
 */
export const verifyAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authorization header missing or invalid format. Expected: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      throw AppError.unauthorized('Bearer authentication token is empty');
    }

    // Verify token with Supabase Auth API
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      logger.warn(`Authentication failed for IP ${req.ip}: ${error?.message || 'User not found'}`);
      throw AppError.unauthorized('Invalid, expired, or revoked authentication token', error);
    }

    // Attach authenticated user and token to request object
    req.user = data.user;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Supabase JWT Authentication Middleware.
 * Attaches `req.user` and `req.token` if a valid Bearer token is provided.
 * Does not block the request if no Authorization header is present.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.trim() !== '') {
        const { data } = await supabaseAdmin.auth.getUser(token);
        if (data?.user) {
          req.user = data.user;
          req.token = token;
        }
      }
    }
    next();
  } catch (error) {
    // For optional auth, log warning and proceed without setting req.user
    logger.debug('Optional auth token validation error:', error);
    next();
  }
};
