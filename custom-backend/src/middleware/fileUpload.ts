import multer from 'multer';
import { AppError } from '../utils/AppError';
import { generateSafeStoredName } from '../utils/fileStorage';
import { Request } from 'express';

// Conservative whitelist of supported MIME types
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

// Maximum 5 MB per file
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Use memory storage for Multer initially to validate BEFORE writing to the final secure path
// For extremely large files, this would be diskStorage, but for 5MB limits memory is safer 
// to prevent polluting disk with invalid or unauthorized files.
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type', 400));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only 1 file per request as specified
  },
  fileFilter
});
