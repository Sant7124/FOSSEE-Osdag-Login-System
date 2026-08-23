import { Request, Response } from 'express';
import { db } from '../db';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    // Lightweight database verification
    await db.query('SELECT 1');

    res.status(200).json({
      status: 'success',
      message: 'Server and Database are healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Fail gracefully without exposing connection strings or credentials
    console.error('Database Health Check Failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service Unavailable - Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
};
