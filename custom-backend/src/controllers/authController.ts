import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../utils/validation';
import * as userService from '../services/userService';
import * as authService from '../services/authService';
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
  try {
    const parsedData = loginSchema.parse(req.body);
    const { rawToken, user } = await authService.login(parsedData);

    // Set HTTP-only secure cookie
    res.cookie('session', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Lax is generally recommended for top-level navigation CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/'
    });

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.session;
    if (token) {
      // Invalidate session in database
      await authService.logout(token);
    }
    
    // Clear the cookie in response
    res.clearCookie('session', { path: '/' });
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};
