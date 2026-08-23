import { AppwriteStorageProvider } from '../src/integrations/appwrite/AppwriteStorageProvider';
import { config } from '../src/config/env';
import fs from 'fs';
import path from 'path';

jest.setTimeout(30000);

describe('Appwrite Storage Integration', () => {
  // We only run this test if the credentials are provided
  const hasAppwriteConfig = !!(config.appwrite.endpoint && config.appwrite.projectId && config.appwrite.apiKey);
  
  if (!hasAppwriteConfig) {
    test.skip('Appwrite credentials not provided in .env, skipping integration tests', () => {});
    return;
  }

  const provider = new AppwriteStorageProvider();
  let testAppwriteFileId: string;
  const testUserId = 'test-user-id';
  const testFileId = 'test-file-uuid-' + Date.now();
  const testBuffer = Buffer.from('Hello Appwrite Integration Test!');
  const mimeType = 'text/plain';
  const originalName = 'appwrite-test.txt';

  test('Upload file to Appwrite', async () => {
    testAppwriteFileId = await provider.uploadFile(
      testUserId,
      testFileId,
      testBuffer,
      mimeType,
      originalName
    );

    expect(testAppwriteFileId).toBeDefined();
    expect(typeof testAppwriteFileId).toBe('string');
  });

  test('Download file from Appwrite', async () => {
    // We create a mock writable stream to capture the downloaded buffer
    let downloadedData = Buffer.alloc(0);
    const mockRes = {
      write: (chunk: any, cb: any) => {
        downloadedData = Buffer.concat([downloadedData, Buffer.from(chunk)]);
        if (cb) cb();
      },
      end: () => {}
    } as any;

    await provider.downloadFile(testAppwriteFileId, mockRes);
    
    expect(downloadedData.toString()).toBe('Hello Appwrite Integration Test!');
  });

  test('Delete file from Appwrite', async () => {
    await provider.deleteFile(testAppwriteFileId);
    
    // Attempting to download it again should throw 404 or fail safely
    let errorMsg = '';
    const mockRes = {
      write: () => {},
      end: () => {}
    } as any;
    
    try {
      await provider.downloadFile(testAppwriteFileId, mockRes);
    } catch (e: any) {
      errorMsg = e.message;
    }
    
    expect(errorMsg).toContain('Error retrieving file');
  });
});
