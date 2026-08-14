import { Request, Response, NextFunction } from 'express';
import { SimulationService } from '../services/simulationService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';

export const getScenarios = async (
  req: Request<{}, {}, {}, { category?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = req.query.category;
    const scenarios = await SimulationService.getScenarios(category);
    sendSuccess(res, 'Scenarios retrieved', scenarios, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export const startSimulation = async (
  req: Request<{}, {}, { scenarioId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized('User identity not found in request');
    }

    const { scenarioId } = req.body;
    if (!scenarioId) {
      throw AppError.badRequest('scenarioId is required in request body');
    }

    const sessionData = await SimulationService.startSimulation(userId, scenarioId);
    sendSuccess(res, 'Simulation session started', sessionData, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

export const processSimulationTurn = async (
  req: Request<{ simulationId: string }, {}, { speechDurationSeconds?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized('User identity not found in request');
    }

    const { simulationId } = req.params;
    if (!simulationId) {
      throw AppError.badRequest('simulationId parameter is required');
    }

    if (!req.file || !req.file.buffer) {
      throw AppError.badRequest('Audio file payload missing in form-data field "audio"');
    }

    const duration = req.body.speechDurationSeconds
      ? parseFloat(req.body.speechDurationSeconds)
      : 2.0;

    const turnResult = await SimulationService.processSimulationTurn(
      userId,
      simulationId,
      req.file.buffer,
      req.file.mimetype,
      isNaN(duration) ? 2.0 : duration
    );

    sendSuccess(res, 'Turn processed successfully', turnResult, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export const endSimulation = async (
  req: Request<{ simulationId: string }, {}, { anxietyScoreAfter?: number }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized('User identity not found in request');
    }

    const { simulationId } = req.params;
    if (!simulationId) {
      throw AppError.badRequest('simulationId parameter is required');
    }

    const anxietyScoreAfter = req.body.anxietyScoreAfter || 3;

    const summaryResult = await SimulationService.endSimulation(
      userId,
      simulationId,
      anxietyScoreAfter
    );

    sendSuccess(res, 'Simulation concluded and evaluated', summaryResult, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};
