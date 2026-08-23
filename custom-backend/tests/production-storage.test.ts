describe('Production Storage Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original process.env
    originalEnv = process.env;
    // Clone process.env for mutation
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
    // Clear modules from require cache to ensure they re-evaluate
    jest.resetModules();
  });

  test('Should fail securely if NODE_ENV=production and Appwrite config is missing', () => {
    // Enforce production mode
    process.env.NODE_ENV = 'production';
    
    expect(() => {
      // We must override the config object directly because re-requiring env.ts
      // will cause dotenv to re-read the .env file and restore the deleted variables.
      const { config } = require('../src/config/env');
      config.env = 'production';
      config.appwrite.endpoint = undefined;
      config.appwrite.projectId = undefined;
      config.appwrite.apiKey = undefined;

      require('../src/integrations/storage/index');
    }).toThrow('FATAL: Appwrite configuration is missing');
  });
});
