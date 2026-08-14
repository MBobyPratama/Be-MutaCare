import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';

export const getDailyDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('User identity not found in request');
    }

    const dashboardData = await DashboardService.getDailyDashboard(userId);

    sendSuccess(
      res,
      'Daily dashboard retrieved',
      dashboardData,
      HTTP_STATUS.OK
    );
  } catch (error) {
    next(error);
  }
};
