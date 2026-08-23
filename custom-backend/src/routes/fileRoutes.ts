import { Router } from 'express';
import * as fileController from '../controllers/fileController';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadMiddleware } from '../middleware/fileUpload';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  skip: () => process.env.NODE_ENV === 'test', // Explicitly isolate tests from global rate limits
  message: {
    status: 'error',
    message: 'Too many upload attempts, please try again later'
  }
});

// All file routes MUST be protected
router.use(requireAuth);

router.post('/', uploadLimiter, uploadMiddleware.single('file'), fileController.uploadFile);
router.get('/', fileController.listFiles);
router.get('/:id', fileController.downloadFile);
router.delete('/:id', fileController.deleteFile);

export default router;
