import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Registration Rate Limiter: Prevent obvious automated abuse
// 5 accounts per hour per IP is very reasonable for typical usage
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: process.env.NODE_ENV === 'test' ? 100 : 5, 
  message: {
    status: 'error',
    message: 'Too many accounts created from this IP, please try again after an hour'
  }
});

// Login Rate Limiter: Prevent brute force password guessing
// 10 attempts per 15 minutes is reasonable for typical usage
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'test' ? 100 : 10, 
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again after 15 minutes'
  }
});

router.post('/register', registerLimiter, authController.register);

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

// Temporary protected route for testing session middleware
router.get('/test-protected', requireAuth, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      message: 'You are authenticated',
      user: req.user
    }
  });
});

export default router;
