import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../utils/app-error.js';

export const roleAdminMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user!.role !== 'admin') {
    throw new ForbiddenError('Access denied: Admins only');
  }
  next();
};
