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

export const getUserProfileById = async (userId: string) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    
    if (!user) {
      // In the rare event the session references a deleted user
      throw new AppError('User not found or session invalid', 401);
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Database Error in getUserProfileById:', error);
    throw new AppError('Internal Server Error', 500);
  }
};
