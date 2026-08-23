import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Identity strictly derived from authenticated session
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const user = await userService.getUserProfileById(userId);

    // Prevent caching of sensitive user data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
