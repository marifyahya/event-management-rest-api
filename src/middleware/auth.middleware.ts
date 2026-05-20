import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../libs/jwt.js';
import { UnauthorizedError } from '../utils/app-error.js';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError();
    }

    const decoded = verifyToken(token) as { id: number; role: string };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError();
  }
};
