import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessmentService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';
import { CreateAssessmentDTO } from '../schemas/assessmentSchema.js';

export const submitInitialAssessment = async (
  req: Request<{}, {}, CreateAssessmentDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('User identity not found in request');
    }

    const result = await AssessmentService.evaluateInitialAssessment(userId, req.body);

    sendSuccess(
      res,
      'Initial assessment evaluated and therapy plan initialized',
      result,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};
