import { StorageProvider } from './StorageProvider';
import { AppwriteStorageProvider } from '../appwrite/AppwriteStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { config } from '../../config/env';

// Determine the active storage provider based on configuration.
// If Appwrite credentials are provided, use Appwrite. Otherwise fallback to Local Storage.
// In test environments, we can mock this provider completely.

let activeProvider: StorageProvider;

if (config.appwrite.endpoint && config.appwrite.projectId && config.appwrite.apiKey) {
  activeProvider = new AppwriteStorageProvider();
} else {
  if (config.env === 'production') {
    throw new Error('FATAL: Appwrite configuration is missing. Production storage must explicitly use Appwrite and cannot silently fall back to local storage.');
  }
  // Fallback to local storage if Appwrite is not fully configured (only in dev/test)
  activeProvider = new LocalStorageProvider();
}
export const storageProvider = activeProvider;

// For testing purposes, we can override the provider
export const setStorageProvider = (provider: StorageProvider) => {
  activeProvider = provider;
};

export const getStorageProvider = () => activeProvider;
