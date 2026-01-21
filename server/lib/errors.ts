/**
 * Custom Error Classes for InnerTruth AI
 * Provides structured error handling and prevents sensitive data leakage.
 */

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: ErrorCode = ErrorCode.INTERNAL_ERROR, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400, ErrorCode.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource Not Found") {
    super(message, 404, ErrorCode.NOT_FOUND);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = "AI Service Failure") {
    super(message, 502, ErrorCode.AI_SERVICE_ERROR);
  }
}

export class ValidationError extends AppError {
  public readonly details?: any;
  constructor(message: string = "Validation Failed", details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR);
    this.details = details;
  }
}
