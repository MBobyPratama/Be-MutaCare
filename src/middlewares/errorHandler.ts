import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // If response is already sent, delegate to default express error handler
  if (res.headersSent) {
    return;
  }

  // Handle operational AppError
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.errorCode}]: ${err.message}`);
    sendError(res, err.message, err.statusCode, err.errorCode, err.details);
    return;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedDetails = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    logger.warn(`ZodValidationError: ${err.message}`);
    sendError(
      res,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      formattedDetails
    );
    return;
  }

  // Handle unhandled unexpected errors
  logger.error('Unhandled System Error:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction ? 'An unexpected error occurred on the server' : err.message;
  const errorDetails = isProduction ? undefined : { stack: err.stack };

  sendError(
    res,
    errorMessage,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    errorDetails
  );
};
