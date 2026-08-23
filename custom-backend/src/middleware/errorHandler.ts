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
  } else if ('type' in err && err.type === 'entity.parse.failed') {
    // Catch Express JSON parse errors explicitly
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  // Do not leak stack traces in production
  const response = {
    status: 'error',
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
