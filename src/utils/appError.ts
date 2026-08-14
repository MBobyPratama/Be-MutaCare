import { HTTP_STATUS, HttpStatusCode } from '../constants/http.js';
import { ERROR_CODES, ErrorCode } from '../constants/errorCodes.js';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errorCode: ErrorCode | string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode | string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    // Restore prototype chain for extending Error in ES5/ES6
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, details);
  }

  static unauthorized(message = 'Unauthorized access', details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, details);
  }

  static forbidden(message = 'Access forbidden', details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, details);
  }

  static notFound(message = 'Resource not found', details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, details);
  }

  static validationError(message = 'Validation failed', details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static internal(message = 'Internal server error', details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_SERVER_ERROR, details, false);
  }
}
