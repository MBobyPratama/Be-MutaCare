import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '../constants/http.js';
import { ERROR_CODES, ErrorCode } from '../constants/errorCodes.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: ErrorCode | string;
    details?: unknown;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: HttpStatusCode = HTTP_STATUS.OK
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errorCode: ErrorCode | string = ERROR_CODES.INTERNAL_SERVER_ERROR,
  details?: unknown
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details !== undefined && { details }),
    },
  };
  return res.status(statusCode).json(responsePayload);
};
