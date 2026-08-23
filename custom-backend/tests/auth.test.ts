import request from 'supertest';
import app from '../src/app';
import { db, pool } from '../src/db';
import bcrypt from 'bcryptjs';

jest.setTimeout(30000);

describe('Authentication API Tests', () => {
  const user = {
    name: 'Auth Test User',
    email: `auth_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
  };
  
  let userId: string;

  beforeAll(async () => {
    // Setup test user manually to isolate login tests from register tests
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(user.password, salt);
    
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id`,
      [user.name, user.email, hash]
    );
    userId = result.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  let validCookie: string;

  test('Successful login creates session and returns safe user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.name).toBe(user.name);
    expect(res.body.data.user).not.toHaveProperty('password_hash');

    // Verify secure cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    // Find the session cookie
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const sessionCookie = cookieArray.find((c: string) => c.startsWith('session='));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    
    validCookie = sessionCookie.split(';')[0]; // Extract just the "session=token" part
  });

  test('Protected request with valid session succeeds', async () => {
    const res = await request(app)
      .get('/api/auth/test-protected')
      .set('Cookie', validCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('You are authenticated');
    expect(res.body.data.user.id).toBe(userId);
  });

  test('Protected request without cookie fails', async () => {
    const res = await request(app)
      .get('/api/auth/test-protected');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  test('Wrong password rejected generically', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('Unknown email rejected generically (same error)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'ValidPassword1!'
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password'); // Exact same message
  });

  test('Case-insensitive email works for login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email.toUpperCase(),
        password: user.password
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('Logout invalidates session and clears cookie', async () => {
    // 1. Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', validCookie);
      
    expect(logoutRes.status).toBe(200);
    
    // Cookie cleared
    const cookiesArray = Array.isArray(logoutRes.headers['set-cookie']) ? logoutRes.headers['set-cookie'] : [logoutRes.headers['set-cookie']];
    const clearCookie = cookiesArray.find((c: string) => c.startsWith('session=;'));
    expect(clearCookie).toBeDefined();

    // 2. Reuse old cookie - must be rejected!
    const res = await request(app)
      .get('/api/auth/test-protected')
      .set('Cookie', validCookie); // Attacker tries to reuse

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired session');
  });

  test('Multiple sessions work independently', async () => {
    // Login session A
    const resA = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(resA.status).toBe(200);
    const cookiesA = Array.isArray(resA.headers['set-cookie']) ? resA.headers['set-cookie'] : [resA.headers['set-cookie']];
    const cookieA = cookiesA.find((c: string) => c && c.startsWith('session=')).split(';')[0];
    
    // Login session B
    const resB = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(resB.status).toBe(200);
    const cookiesB = Array.isArray(resB.headers['set-cookie']) ? resB.headers['set-cookie'] : [resB.headers['set-cookie']];
    const cookieB = cookiesB.find((c: string) => c && c.startsWith('session=')).split(';')[0];

    // Both work initially
    await request(app).get('/api/auth/test-protected').set('Cookie', cookieA).expect(200);
    await request(app).get('/api/auth/test-protected').set('Cookie', cookieB).expect(200);

    // Logout A
    await request(app).post('/api/auth/logout').set('Cookie', cookieA).expect(200);

    // A fails, B still works
    await request(app).get('/api/auth/test-protected').set('Cookie', cookieA).expect(401);
    await request(app).get('/api/auth/test-protected').set('Cookie', cookieB).expect(200);
  });
});
