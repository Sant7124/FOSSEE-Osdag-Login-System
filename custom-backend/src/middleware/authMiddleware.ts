import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Authentication logic will be implemented here
  // Needs to verify session cookie and attach user context
  next(new AppError('Unauthorized', 401));
};
