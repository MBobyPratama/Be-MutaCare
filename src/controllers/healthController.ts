import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService.js';
import { sendSuccess } from '../utils/response.js';

export const getHealthStatus = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const healthStatus = HealthService.getStatus();
    sendSuccess(res, 'MutaCare API is healthy and operational', healthStatus);
  } catch (error) {
    next(error);
  }
};
