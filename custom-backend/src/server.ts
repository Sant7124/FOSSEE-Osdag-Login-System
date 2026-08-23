import app from './app';
import { config } from './config/env';

const startServer = async () => {
  try {
    // Database connection initialization will go here
    
    app.listen(config.port, () => {
      console.log(\Server running in \ mode on port \\);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
