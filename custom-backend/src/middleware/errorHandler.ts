import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Do not leak stack traces in production
  const response = {
    status: 'error',
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
