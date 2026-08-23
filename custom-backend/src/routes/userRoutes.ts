import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Strict identity derivation from requireAuth session context
router.get('/', requireAuth, userController.getProfile);

export default router;
