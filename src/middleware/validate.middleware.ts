import { Request, Response, NextFunction } from 'express';
import { success, ZodError } from 'zod';

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body || {},
        query: req.query || {},
        params: req.params || {},
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.reduce((acc: any, issue) => {
          const path = issue.path.slice(1).join('.');
          if (!acc[path]) {
            acc[path] = [];
          }
          acc[path].push(issue.message);
          return acc;
        }, {});

        return res.status(400).json({
          success: false,
          message: 'The given data was invalid.',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};
