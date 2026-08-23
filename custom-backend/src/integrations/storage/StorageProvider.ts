export interface StorageProvider {
  /**
   * Uploads a file buffer to the storage provider
   * @param userId The ID of the user uploading the file
   * @param fileId A securely generated unique identifier for this file
   * @param buffer The file buffer
   * @param mimeType The file's mime type
   * @param originalName The original filename
   * @returns A promise that resolves to a provider-specific unique ID (e.g. appwrite_file_id)
   */
  uploadFile(userId: string, fileId: string, buffer: Buffer, mimeType: string, originalName: string): Promise<string>;

  /**
   * Streams a file from the storage provider to an Express Response
   * @param providerFileId The provider-specific unique ID (e.g. appwrite_file_id)
   * @param res The Express Response object to pipe the stream into
   */
  downloadFile(providerFileId: string, res: NodeJS.WritableStream): Promise<void>;

  /**
   * Deletes a file from the storage provider
   * @param providerFileId The provider-specific unique ID (e.g. appwrite_file_id)
   */
  deleteFile(providerFileId: string): Promise<void>;
}
