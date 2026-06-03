import { extend } from 'zod/mini';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        timestamp: this.timestamp,
      },
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string>[];

  constructor(message: string = 'Validation failed', errors: Record<string, string>[] = []) {
    super(message, 400);
    this.errors = errors;
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        errors: this.errors,
        timestamp: this.timestamp,
      },
    };
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class BadRequest extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}
