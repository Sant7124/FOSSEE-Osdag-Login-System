/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Clear any dummy session data if tests created them (none should exist yet)
  pgm.sql('DELETE FROM sessions;');
  
  // Add securely hashed token field for lookup
  pgm.addColumns('sessions', {
    token_hash: { type: 'VARCHAR(64)', notNull: true, unique: true },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumns('sessions', ['token_hash']);
};
