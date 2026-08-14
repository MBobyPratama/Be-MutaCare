import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/appError.js';

export const verifyAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw AppError.unauthorized('Bearer token is empty');
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw AppError.unauthorized('Invalid or expired authentication token', error);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
