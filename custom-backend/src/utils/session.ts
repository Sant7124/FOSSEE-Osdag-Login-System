import crypto from 'crypto';

export interface SessionTokens {
  rawToken: string;
  tokenHash: string;
}

/**
 * Generates a cryptographically secure random session token and its SHA-256 hash.
 * - rawToken: Set in the user's HTTP-Only cookie.
 * - tokenHash: Stored in the database `sessions.token_hash` column.
 */
export const generateSessionToken = (): SessionTokens => {
  // Generate 32 bytes of secure random data, converted to base64url for safe HTTP transport
  const rawToken = crypto.randomBytes(32).toString('base64url');
  
  // Hash the token using SHA-256
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  return { rawToken, tokenHash };
};

/**
 * Hashes a raw token received from a cookie to look up the database record.
 */
export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};
