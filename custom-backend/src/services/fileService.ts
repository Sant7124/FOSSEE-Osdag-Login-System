import { db } from '../db';
import { AppError } from '../utils/AppError';
import { getStorageProvider } from '../integrations/storage';
import crypto from 'crypto';

export const uploadFile = async (userId: string, originalName: string, mimeType: string, size: number, buffer: Buffer) => {
  const fileId = crypto.randomUUID();
  const provider = getStorageProvider();

  let providerFileId: string;
  
  try {
    // 1. Upload to storage provider FIRST
    providerFileId = await provider.uploadFile(userId, fileId, buffer, mimeType, originalName);
  } catch (error: any) {
    console.error('Storage Provider Upload Error:', error);
    throw new AppError('Failed to upload file to storage', 500);
  }

  try {
    // 2. Insert DB record mapping to the provider's file ID
    const result = await db.query(
      `INSERT INTO files (id, user_id, original_name, stored_name, mime_type, size, storage_path, appwrite_file_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, original_name as "originalName", mime_type as "mimeType", size, created_at as "createdAt"`,
      [
        fileId,
        userId,
        originalName,
        `${fileId}.bin`, // Legacy stored_name for local storage backwards compatibility
        mimeType,
        size,
        providerFileId, // Legacy storage_path (reused for LocalStorageProvider absolute path)
        providerFileId  // New appwrite_file_id (if Appwrite is active, this is the Appwrite object ID)
      ]
    );

    return result.rows[0];
  } catch (error) {
    // 3. DB Cleanup on Failure: If DB fails, we MUST physically remove the orphaned file from storage
    try {
      await provider.deleteFile(providerFileId);
    } catch (cleanupError) {
      console.error(`Failed to cleanup orphaned storage file: ${providerFileId}`, cleanupError);
    }

    if (error instanceof AppError) throw error;
    console.error('File Database Insert Error:', error);
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
  
  const provider = getStorageProvider();

  // The provider ID is stored in appwrite_file_id or storage_path (for local)
  const providerFileId = file.appwrite_file_id || file.storage_path;

  // 2. Delete the physical file from storage provider
  await provider.deleteFile(providerFileId);

  // 3. Delete metadata
  await db.query(`DELETE FROM files WHERE id = $1 AND user_id = $2`, [fileId, userId]);
};
