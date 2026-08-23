import { Request, Response, NextFunction } from 'express';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};
