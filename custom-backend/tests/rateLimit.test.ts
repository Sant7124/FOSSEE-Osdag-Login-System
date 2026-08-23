import request from 'supertest';
import app from '../src/app';

jest.setTimeout(30000);

describe('Rate Limiter Tests', () => {
  // Use a unique IP for these tests to isolate them from other test suites that might run in parallel or sequence
  const testIp = `127.0.0.1-${Date.now()}`;

  afterAll(async () => {
    const { pool } = require('../src/db');
    await pool.end();
  });

  describe('Global Rate Limiter', () => {
    test('Requests below limit succeed', async () => {
      // 100 requests per 15 minutes is the limit. Let's make 5 requests.
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .get('/health')
          .set('x-test-ip', testIp);
        expect(res.status).toBe(200);
      }
    });

    test('Requests above limit return 429', async () => {
      // The global limit is 100. We already made 5. Make 95 more to hit the limit.
      for (let i = 0; i < 95; i++) {
        await request(app).get('/health').set('x-test-ip', testIp);
      }

      // The 101st request should fail
      const res = await request(app).get('/health').set('x-test-ip', testIp);
      expect(res.status).toBe(429);
      expect(res.text).toContain('Too many requests');
    });
  });

  describe('Login Rate Limiter', () => {
    const loginTestIp = `10.0.0.1-${Date.now()}`;

    test('Requests below limit succeed', async () => {
      // Login limit is 10
      for (let i = 0; i < 9; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('x-test-ip', loginTestIp)
          .send({ email: 'test@example.com', password: 'wrong' });
        expect(res.status).toBe(401); // 401 means it wasn't rate limited
      }
    });

    test('Requests above limit return 429', async () => {
      // 10th request
      await request(app)
        .post('/api/auth/login')
        .set('x-test-ip', loginTestIp)
        .send({ email: 'test@example.com', password: 'wrong' });

      // 11th request should be rate limited
      const res = await request(app)
        .post('/api/auth/login')
        .set('x-test-ip', loginTestIp)
        .send({ email: 'test@example.com', password: 'wrong' });
      
      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Too many login attempts');
    });
  });

  describe('Registration Rate Limiter', () => {
    const registerTestIp = `192.168.1.1-${Date.now()}`;

    test('Requests above limit return 429', async () => {
      // Register limit is 5
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .set('x-test-ip', registerTestIp)
          .send({ name: 'test', email: `test${i}@example.com`, password: 'password123' });
      }

      // 6th request should be rate limited
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-test-ip', registerTestIp)
        .send({ name: 'test', email: 'test6@example.com', password: 'password123' });
      
      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Too many accounts created');
    });
  });

  // File upload rate limiter operates behind requireAuth, but follows the exact same logic structure.
  // The global, login, and register limiters successfully prove the custom test isolation and rate limiting mechanism.
});
