import { StorageProvider } from '../storage/StorageProvider';
import { appwriteStorage } from './client';
import { config } from '../../config/env';
import { AppError } from '../../utils/AppError';
// @ts-ignore
import { InputFile } from 'node-appwrite/file';

export class AppwriteStorageProvider implements StorageProvider {
  private bucketId = config.appwrite.bucketId;

  async uploadFile(userId: string, fileId: string, buffer: Buffer, mimeType: string, originalName: string): Promise<string> {
    try {
      const inputFile = InputFile.fromBuffer(buffer, originalName);
      
      // We use the securely generated fileId as the Appwrite object ID.
      // This enforces deterministic mapping and prevents client manipulation of storage identifiers.
      const response = await appwriteStorage.createFile(
        this.bucketId,
        fileId,
        inputFile
      );
      
      return response.$id;
    } catch (error: any) {
      console.error('Appwrite Upload Error:', error);
      throw new AppError('Error uploading file to remote storage', 500);
    }
  }

  async downloadFile(providerFileId: string, res: NodeJS.WritableStream): Promise<void> {
    try {
      // getFileDownload returns an ArrayBuffer in node-appwrite
      const arrayBuffer = await appwriteStorage.getFileDownload(
        this.bucketId,
        providerFileId
      );
      
      const buffer = Buffer.from(arrayBuffer);
      
      return new Promise((resolve, reject) => {
        res.write(buffer, (err) => {
          if (err) {
            console.error('Appwrite Download Stream Error:', err);
            reject(new AppError('Error streaming file from remote storage', 500));
          } else {
            resolve();
          }
        });
        res.end();
      });
    } catch (error: any) {
      console.error('Appwrite Download Error:', error);
      throw new AppError('Error retrieving file from remote storage', 500);
    }
  }

  async deleteFile(providerFileId: string): Promise<void> {
    try {
      await appwriteStorage.deleteFile(this.bucketId, providerFileId);
    } catch (error: any) {
      // Appwrite throws 404 if the file doesn't exist, which is safe to ignore during cleanup
      if (error.code !== 404) {
        console.error(`Appwrite delete error for ${providerFileId}:`, error);
        throw new AppError('Error deleting file from remote storage', 500);
      }
    }
  }
}
