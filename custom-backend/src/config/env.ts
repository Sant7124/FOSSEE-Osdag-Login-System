import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    url: process.env.DATABASE_URL || '',
  },
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'fallback_secret',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  file: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  }
};
