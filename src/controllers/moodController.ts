import { Request, Response, NextFunction } from 'express';
import { MoodService } from '../services/moodService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';
import { CreateMoodCheckInDTO } from '../schemas/moodSchema.js';

export const submitMoodCheckIn = async (
  req: Request<{}, {}, CreateMoodCheckInDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('User identity not found in request');
    }

    const result = await MoodService.logDailyMood(userId, req.body);

    sendSuccess(
      res,
      'Mood logged successfully',
      result,
      HTTP_STATUS.OK
    );
  } catch (error) {
    next(error);
  }
};
