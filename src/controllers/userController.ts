import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';
import { UpdateProfileDTO } from '../schemas/authSchema.js';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized('Pengguna tidak terautentikasi');
    }

    const profile = await AuthService.getCurrentUserProfile(userId);
    sendSuccess(res, 'Profile retrieved successfully', profile, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized('Pengguna tidak terautentikasi');
    }

    const updatedProfile = await AuthService.updateUserProfile(userId, req.body);
    sendSuccess(res, 'Profile updated successfully', updatedProfile, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};
