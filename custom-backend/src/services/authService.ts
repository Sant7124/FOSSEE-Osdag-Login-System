import { db } from '../db';
import bcrypt from 'bcryptjs';
import { LoginInput } from '../utils/validation';
import { AppError } from '../utils/AppError';
import { generateSessionToken, hashToken } from '../utils/session';

// 7 days in milliseconds
const SESSION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export const login = async (input: LoginInput) => {
  // 1. Find user by email
  const userResult = await db.query(
    'SELECT id, email, password_hash, name FROM users WHERE email = $1',
    [input.email]
  );

  const user = userResult.rows[0];

  // 2. Generic rejection if not found
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Verify password
  const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // 4. Generate secure session token
  const { rawToken, tokenHash } = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS);

  // 5. Save session in DB
  await db.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  // 6. Return safe user and raw cookie token
  return {
    rawToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

export const logout = async (rawToken: string) => {
  if (!rawToken) return;

  const tokenHash = hashToken(rawToken);

  // Set revoked_at to NOW() for the matched active session
  await db.query(
    `UPDATE sessions 
     SET revoked_at = NOW() 
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
};
