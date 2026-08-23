import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController';

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

router.post('/register', registerLimiter, authController.register);

// These will be implemented in later phases
router.post('/login', authController.login);
router.post('/logout', authController.logout);

export default router;
