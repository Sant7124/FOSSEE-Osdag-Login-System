import { Pool } from 'pg';
import { config } from '../config/env';

if (!config.db.url) {
  console.error('FATAL ERROR: DATABASE_URL is missing. Please verify your environment configuration.');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: config.db.url,
  // Enforce SSL for managed services like Supabase
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
