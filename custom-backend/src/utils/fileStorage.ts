import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Use an environment variable or default to 'uploads'
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || 'uploads');

/**
 * Validates and resolves the storage path for a user's file.
 * Prevents path traversal attacks by strictly verifying the resolved path
 * remains inside the intended upload directory for that specific user.
 */
export const resolveUserStoragePath = async (userId: string, filename: string): Promise<string> => {
  // 1. Determine user's logical directory
  const userDir = path.join(UPLOAD_ROOT, 'users', userId);
  
  // 2. Ensure directory exists safely
  await fs.mkdir(userDir, { recursive: true });

  // 3. Resolve the full final storage path
  const finalPath = path.resolve(userDir, filename);

  // 4. Absolute Path Traversal Check
  // The final resolved path MUST strictly start with the user's directory
  if (!finalPath.startsWith(userDir + path.sep)) {
    throw new Error('Path traversal detected');
  }

  return finalPath;
};

/**
 * Generates a cryptographically secure, collision-resistant filename.
 */
export const generateSafeStoredName = (): string => {
  return crypto.randomUUID();
};
