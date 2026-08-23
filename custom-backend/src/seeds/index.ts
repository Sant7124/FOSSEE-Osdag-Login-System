import { db, pool } from '../db';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    console.log('Starting database seed...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Fossee2026!', salt);

    // Seed 3 test users required by FOSSEE
    const users = [
      { name: 'Alice Admin', email: 'alice@example.com', hash: passwordHash },
      { name: 'Bob User', email: 'bob@example.com', hash: passwordHash },
      { name: 'Charlie Tester', email: 'charlie@example.com', hash: passwordHash }
    ];

    for (const user of users) {
      await db.query(
        `INSERT INTO users (email, password_hash, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) DO NOTHING`,
        [user.email, user.hash, user.name]
      );
    }

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
};

seed();
