import { Request, Response, NextFunction } from 'express';
import { registerSchema } from '../utils/validation';
import * as userService from '../services/userService';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate Input
    const parsedData = registerSchema.parse(req.body);

    // 2. Business Logic (Check duplicates, Hash password, Insert)
    const user = await userService.registerUser(parsedData);

    // 3. Return Safe Response
    res.status(201).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // Map Zod validation errors to a clean client response
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ message: 'Not implemented' });
};
