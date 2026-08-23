exports.up = (pgm) => {
  // We use citext for case-insensitive emails
  pgm.sql('CREATE EXTENSION IF NOT EXISTS citext');
  
  // Users Table
  pgm.sql(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email CITEXT NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Sessions Table
  pgm.sql(`
    CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP WITH TIME ZONE
    );
  `);
  
  // Index for quick active/expiry session lookups
  pgm.sql(`CREATE INDEX idx_sessions_user_id ON sessions(user_id);`);
  pgm.sql(`CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);`);

  // Files Table
  pgm.sql(`
    CREATE TABLE files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL UNIQUE,
      mime_type VARCHAR(255) NOT NULL,
      size BIGINT NOT NULL CHECK (size > 0),
      storage_path VARCHAR(512) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`CREATE INDEX idx_files_user_id ON files(user_id);`);
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS files;');
  pgm.sql('DROP TABLE IF EXISTS sessions;');
  pgm.sql('DROP TABLE IF EXISTS users;');
  pgm.sql('DROP EXTENSION IF EXISTS citext;');
};
