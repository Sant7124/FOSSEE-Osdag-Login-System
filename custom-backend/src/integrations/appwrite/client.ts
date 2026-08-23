import { Client, Storage } from 'node-appwrite';
import { config } from '../../config/env';

// Validate required config
if (process.env.NODE_ENV === 'production') {
  if (!config.appwrite.endpoint || !config.appwrite.projectId || !config.appwrite.apiKey) {
    throw new Error('FATAL: Appwrite configuration is missing in production.');
  }
}

export const appwriteClient = new Client()
  .setEndpoint(config.appwrite.endpoint || 'https://cloud.appwrite.io/v1')
  .setProject(config.appwrite.projectId || 'development-project-id')
  .setKey(config.appwrite.apiKey || 'development-api-key');

export const appwriteStorage = new Storage(appwriteClient);
