import request from 'supertest';
import app from '../src/app';
import { db, pool } from '../src/db';
import bcrypt from 'bcryptjs';

jest.setTimeout(30000);

describe('Protected Profile API Tests', () => {
  const users = [
    { name: 'Profile User A', email: `a_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '' },
    { name: 'Profile User B', email: `b_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '' },
    { name: 'Profile User C', email: `c_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '' }
  ];

  beforeAll(async () => {
    // 1. Create three separate users
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('SecurePassword123!', salt);

    for (const u of users) {
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [u.name, u.email, hash]
      );
      u.id = result.rows[0].id;

      // 2. Login each user to get their separate authentication cookies
      const loginRes = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
      const cookies = loginRes.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      u.cookie = cookieArray.find((c: string) => c.startsWith('session=')).split(';')[0];
    }
  });

  afterAll(async () => {
    // Cleanup users (will cascade delete sessions)
    for (const u of users) {
      await db.query('DELETE FROM users WHERE id = $1', [u.id]);
    }
    await pool.end();
  });

  test('User A gets exactly User A profile safely', async () => {
    const res = await request(app).get('/api/me').set('Cookie', users[0].cookie);
    
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(users[0].id);
    expect(res.body.data.user.name).toBe(users[0].name);
    
    // Check sensitive data exclusion
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('token_hash');
    
    // Check cache headers
    expect(res.headers['cache-control']).toBe('no-store, no-cache, must-revalidate, private');
  });

  test('User B gets exactly User B profile safely', async () => {
    const res = await request(app).get('/api/me').set('Cookie', users[1].cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(users[1].id);
  });

  test('User C gets exactly User C profile safely', async () => {
    const res = await request(app).get('/api/me').set('Cookie', users[2].cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(users[2].id);
  });

  test('Authenticated User Cannot Select Another User (Query Tampering)', async () => {
    // Authenticate as A, but request B's identity via query parameter
    const res = await request(app)
      .get(`/api/me?userId=${users[1].id}&id=${users[1].id}`)
      .set('Cookie', users[0].cookie);

    // It MUST still return User A because identity comes ONLY from the session cookie
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(users[0].id);
    expect(res.body.data.user.id).not.toBe(users[1].id);
  });

  test('Authenticated User Cannot Select Another User (Body Tampering)', async () => {
    // Authenticate as A, but pass B's identity in the body
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', users[0].cookie)
      .send({ userId: users[1].id, email: users[1].email });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(users[0].id);
  });

  test('Authenticated User Cannot Select Another User (Header Tampering)', async () => {
    // Authenticate as A, but pass B's identity in fake custom headers
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', users[0].cookie)
      .set('X-User-Id', users[1].id)
      .set('Authorization', `Bearer ${users[1].id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(users[0].id);
  });

  test('Concurrent requests for different users maintain absolute isolation', async () => {
    // Fire requests concurrently
    const reqA = request(app).get('/api/me').set('Cookie', users[0].cookie);
    const reqB = request(app).get('/api/me').set('Cookie', users[1].cookie);
    const reqC = request(app).get('/api/me').set('Cookie', users[2].cookie);

    const [resA, resB, resC] = await Promise.all([reqA, reqB, reqC]);

    expect(resA.body.data.user.id).toBe(users[0].id);
    expect(resB.body.data.user.id).toBe(users[1].id);
    expect(resC.body.data.user.id).toBe(users[2].id);
  });

  test('Missing authentication cookie is rejected', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  test('Invalid session token is rejected', async () => {
    const res = await request(app).get('/api/me').set('Cookie', 'session=invalid_garbage_token');
    expect(res.status).toBe(401);
  });
});
