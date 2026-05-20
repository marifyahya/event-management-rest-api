import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../libs/logger.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle Custom App Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Data already exists (Unique constraint violation)',
          statusCode: 409,
          timestamp: new Date().toISOString(),
          target: err.meta?.target,
        },
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Resource not found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Fallback for Internal Server Errors
  const errorResponse = {
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Internal server error',
      statusCode: 500,
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString(),
    },
  };

  if (isDevelopment) {
    logger.error(
      {
        err,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
      },
      'Unhandled error',
    );
  }

  res.status(500).json(errorResponse);
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
};
