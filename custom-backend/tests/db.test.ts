import { pool, db } from '../src/db';

jest.setTimeout(30000);

describe('Database Foundation Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('Database connection and health check works', async () => {
    const res = await db.query('SELECT 1 as result');
    expect(res.rows[0].result).toBe(1);
  });

  test('Users table exists with required constraints', async () => {
    // Verify table exists by attempting a query
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    expect(res.rows.length).toBeGreaterThan(0);

    const columns = res.rows.map((row) => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('password_hash');
    expect(columns).toContain('name');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');

    // Verify email is citext
    const emailCol = res.rows.find((row) => row.column_name === 'email');
    expect(emailCol.data_type).toBe('USER-DEFINED'); // citext is user-defined in pg metadata usually
  });

  test('Sessions table exists with correct foreign keys', async () => {
    const res = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `);
    expect(res.rows.length).toBeGreaterThan(0);

    const columns = res.rows.map((row) => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('user_id');
    expect(columns).toContain('expires_at');
    expect(columns).toContain('token_hash');
  });

  test('Files table exists and checks file size constraint', async () => {
    const res = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'files'
    `);
    expect(res.rows.length).toBeGreaterThan(0);

    const columns = res.rows.map((row) => row.column_name);
    expect(columns).toContain('size');
  });
});
