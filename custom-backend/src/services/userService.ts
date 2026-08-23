import { db } from '../db';
import bcrypt from 'bcryptjs';
import { RegisterInput } from '../utils/validation';
import { AppError } from '../utils/AppError';

// BCRYPT COST FACTOR
// Cost factor 12 provides strong protection against brute-force/rainbow tables
// while taking ~200-300ms on modern hardware, which is perfectly acceptable for registration.
const BCRYPT_COST = 12;

export const registerUser = async (input: RegisterInput) => {
  // Hash the password only after validation (which is already done in controller)
  const salt = await bcrypt.genSalt(BCRYPT_COST);
  const passwordHash = await bcrypt.hash(input.password, salt);

  try {
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at as "createdAt"`,
      [input.name, input.email, passwordHash]
    );

    // Safe user representation (no password hash)
    return result.rows[0];
  } catch (error: any) {
    // 23505 is the PostgreSQL unique violation error code
    if (error.code === '23505') {
      throw new AppError('An account with these credentials already exists.', 409);
    }
    
    // Log unexpected database errors internally but do not leak them
    console.error('Database Error in registerUser:', error);
    throw new AppError('Internal Server Error', 500);
  }
};
