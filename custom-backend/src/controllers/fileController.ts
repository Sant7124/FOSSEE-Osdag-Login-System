import { Request, Response, NextFunction } from 'express';

export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getFile = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};
