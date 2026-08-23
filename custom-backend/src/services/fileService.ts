import { db } from '../db';
import { AppError } from '../utils/AppError';
import { resolveUserStoragePath, generateSafeStoredName } from '../utils/fileStorage';
import fs from 'fs/promises';

export const uploadFile = async (userId: string, originalName: string, mimeType: string, size: number, buffer: Buffer) => {
  // 1. Generate secure storage name
  const storedName = generateSafeStoredName();
  
  // 2. Resolve safe path
  const storagePath = await resolveUserStoragePath(userId, storedName);

  try {
    // 3. Write physical file securely
    await fs.writeFile(storagePath, buffer);

    // 4. Insert DB record
    const result = await db.query(
      `INSERT INTO files (user_id, original_name, stored_name, mime_type, size, storage_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, original_name as "originalName", mime_type as "mimeType", size, created_at as "createdAt"`,
      [userId, originalName, storedName, mimeType, size, storagePath]
    );

    return result.rows[0];
  } catch (error) {
    // 5. DB Cleanup on Failure: If inserting to DB fails, we must physically remove the file
    try {
      await fs.unlink(storagePath);
    } catch (cleanupError) {
      console.error(`Failed to cleanup orphaned physical file: ${storagePath}`, cleanupError);
    }

    if (error instanceof AppError) throw error;
    console.error('File Upload Error:', error);
    throw new AppError('Internal Server Error', 500);
  }
};

export const listUserFiles = async (userId: string) => {
  // DB enforces strict ownership isolation
  const result = await db.query(
    `SELECT id, original_name as "originalName", mime_type as "mimeType", size, created_at as "createdAt"
     FROM files
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getUserFileMetadata = async (fileId: string, userId: string) => {
  // DB strictly verifies both the file ID and the owner ID (Authentication mapping)
  const result = await db.query(
    `SELECT * FROM files WHERE id = $1 AND user_id = $2`,
    [fileId, userId]
  );
  
  const file = result.rows[0];
  if (!file) {
    // 404 is used generically instead of 403 to prevent cross-user resource enumeration
    throw new AppError('File not found', 404);
  }
  return file;
};

export const deleteUserFile = async (fileId: string, userId: string) => {
  // 1. Retrieve metadata securely enforcing ownership
  const file = await getUserFileMetadata(fileId, userId);

  // 2. Delete the physical file
  try {
    await fs.unlink(file.storage_path);
  } catch (error: any) {
    // If the physical file is already gone, that's fine, proceed to cleanup DB
    if (error.code !== 'ENOENT') {
      console.error(`Filesystem delete error for ${file.storage_path}:`, error);
      throw new AppError('Internal Server Error', 500);
    }
  }

  // 3. Delete metadata
  await db.query(`DELETE FROM files WHERE id = $1 AND user_id = $2`, [fileId, userId]);
};
