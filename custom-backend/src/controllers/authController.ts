import { Request, Response, NextFunction } from 'express';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};
