import { Router } from 'express';
import * as fileController from '../controllers/fileController';

const router = Router();

router.get('/', fileController.listFiles);
router.post('/', fileController.uploadFile);
router.get('/:id', fileController.getFile);
router.delete('/:id', fileController.deleteFile);

export default router;
