import request from 'supertest';
import app from '../src/app';
import { db, pool } from '../src/db';

jest.setTimeout(30000);

describe('Registration API Tests', () => {
  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  afterAll(async () => {
    // Cleanup the created test user
    await db.query('DELETE FROM users WHERE email = $1', [uniqueEmail.toLowerCase()]);
    await pool.end();
  });

  test('Successful registration creates user and returns safe response', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: uniqueEmail,
        password: 'ValidPassword1!'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.name).toBe('Test User');
    expect(res.body.data.user.email).toBe(uniqueEmail.toLowerCase());
    
    // Crucial security checks
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.user).not.toHaveProperty('session');

    // Verify database state
    const dbUser = await db.query('SELECT * FROM users WHERE email = $1', [uniqueEmail.toLowerCase()]);
    expect(dbUser.rows.length).toBe(1);
    const savedUser = dbUser.rows[0];
    
    // Original password MUST NOT be stored
    expect(savedUser.password_hash).not.toBe('ValidPassword1!');
    // Verify it is a valid bcrypt hash (starts with $2a$ or $2b$)
    expect(savedUser.password_hash).toMatch(/^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/);
  });

  test('Duplicate email is rejected safely', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Tester',
        email: uniqueEmail, // Same email as previous test
        password: 'ValidPassword2@'
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An account with these credentials already exists.');
  });

  test('Case-insensitive duplicate email is rejected safely', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Tester 2',
        email: uniqueEmail.toUpperCase(), // Same email but uppercase
        password: 'ValidPassword3@'
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An account with these credentials already exists.');
  });

  test('Missing required fields rejected', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({}); // Empty body

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('Invalid email rejected', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'ValidPassword1!'
      });

    expect(res.status).toBe(400);
  });

  test('Weak password rejected', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Password',
        email: `weak_${Date.now()}@example.com`,
        password: 'weak' // Too short, no numbers
      });

    expect(res.status).toBe(400);
    const pwdError = res.body.errors.find((e: any) => e.path === 'password');
    expect(pwdError).toBeDefined();
  });

  test('Extra malicious fields are stripped', async () => {
    const maliciousEmail = `malicious_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker',
        email: maliciousEmail,
        password: 'ValidPassword1!',
        id: '12345-hacked-id', // Trying to inject an ID
        password_hash: 'injected_hash',
        role: 'admin'
      });

    // Zod .strict() will actually reject the entire request with a 400 Bad Request
    // This is the safest approach - reject requests containing undefined fields.
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  test('SQL injection attempt fails', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: "Test' OR '1'='1",
        email: `sqli_${Date.now()}@example.com`,
        password: 'ValidPassword1!'
      });

    // It should successfully create the user with the literal name "Test' OR '1'='1"
    // Because parameterization prevents execution of the payload.
    expect(res.status).toBe(201);
    expect(res.body.data.user.name).toBe("Test' OR '1'='1");
    
    // Cleanup
    await db.query('DELETE FROM users WHERE email = $1', [`sqli_${Date.now()}@example.com`]);
  });
});
