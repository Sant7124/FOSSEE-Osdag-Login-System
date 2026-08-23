import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from '../utils/AppError';
import { hashToken } from '../utils/session';

// Extend Express Request object to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sessionId: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies.session;

    if (!rawToken) {
      throw new AppError('Authentication required', 401);
    }

    const tokenHash = hashToken(rawToken);

    // 1. Find active session
    // It must not be revoked, and it must not be expired
    const sessionResult = await db.query(
      `SELECT id, user_id 
       FROM sessions 
       WHERE token_hash = $1 
         AND revoked_at IS NULL 
         AND expires_at > NOW()`,
      [tokenHash]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      // Invalid, expired, or revoked token
      throw new AppError('Invalid or expired session', 401);
    }

    // 2. Attach user identity to request context
    req.user = {
      id: session.user_id,
      sessionId: session.id,
    };

    // 3. Update last_used_at lazily (don't block the request)
    // In a high-traffic app, we might only update this once a day per session
    // For this scope, we can update it asynchronously
    db.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE id = $1',
      [session.id]
    ).catch(err => console.error('Failed to update session last_used_at:', err));

    next();
  } catch (error) {
    next(error);
  }
};
