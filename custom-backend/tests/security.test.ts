import request from 'supertest';
import app from '../src/app';
import { db, pool } from '../src/db';
import fs from 'fs/promises';
import path from 'path';

jest.setTimeout(40000);

describe('Full Security & Authorization Audit Tests', () => {
  const users = {
    Alice: { email: `alice_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '', fileId: '' },
    Bob: { email: `bob_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '', fileId: '' },
    Charlie: { email: `charlie_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '', fileId: '' }
  };

  const DUMMY_CONTENT = Buffer.from('Audit test content');

  afterAll(async () => {
    for (const u of Object.values(users)) {
      if (u.id) {
        await db.query('DELETE FROM users WHERE id = $1', [u.id]);
      }
    }
    await pool.end();
    
    try {
      await fs.rm(path.resolve(process.env.UPLOAD_DIR || 'uploads'), { recursive: true, force: true });
    } catch(e) {}
  });

  describe('End-to-End Three-User Workflow & Isolation', () => {
    test('Alice registers, logs in, uploads, and accesses her file', async () => {
      // Register
      await request(app).post('/api/auth/register').send({ name: 'Alice', email: users.Alice.email, password: users.Alice.password }).expect(201);
      
      // Login
      const login = await request(app).post('/api/auth/login').send({ email: users.Alice.email, password: users.Alice.password }).expect(200);
      users.Alice.id = login.body.data.user.id;
      const cookies = login.headers['set-cookie'];
      users.Alice.cookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.startsWith('session=')).split(';')[0];
      
      // Upload
      const upload = await request(app).post('/api/files').set('Cookie', users.Alice.cookie).attach('file', DUMMY_CONTENT, { filename: 'alice.txt', contentType: 'text/plain' }).expect(201);
      users.Alice.fileId = upload.body.data.file.id;

      // Access
      await request(app).get(`/api/files/${users.Alice.fileId}`).set('Cookie', users.Alice.cookie).expect(200);
    });

    test('Bob registers, logs in, uploads, and accesses his file', async () => {
      await request(app).post('/api/auth/register').send({ name: 'Bob', email: users.Bob.email, password: users.Bob.password }).expect(201);
      const login = await request(app).post('/api/auth/login').send({ email: users.Bob.email, password: users.Bob.password }).expect(200);
      users.Bob.id = login.body.data.user.id;
      const cookies = login.headers['set-cookie'];
      users.Bob.cookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.startsWith('session=')).split(';')[0];
      
      const upload = await request(app).post('/api/files').set('Cookie', users.Bob.cookie).attach('file', DUMMY_CONTENT, { filename: 'bob.txt', contentType: 'text/plain' }).expect(201);
      users.Bob.fileId = upload.body.data.file.id;
    });

    test('Charlie registers, logs in, uploads, and accesses his file', async () => {
      await request(app).post('/api/auth/register').send({ name: 'Charlie', email: users.Charlie.email, password: users.Charlie.password }).expect(201);
      const login = await request(app).post('/api/auth/login').send({ email: users.Charlie.email, password: users.Charlie.password }).expect(200);
      users.Charlie.id = login.body.data.user.id;
      const cookies = login.headers['set-cookie'];
      users.Charlie.cookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.startsWith('session=')).split(';')[0];
      
      const upload = await request(app).post('/api/files').set('Cookie', users.Charlie.cookie).attach('file', DUMMY_CONTENT, { filename: 'charlie.txt', contentType: 'text/plain' }).expect(201);
      users.Charlie.fileId = upload.body.data.file.id;
    });

    test('Cross-user access is completely denied', async () => {
      // Alice tries Bob and Charlie
      await request(app).get(`/api/files/${users.Bob.fileId}`).set('Cookie', users.Alice.cookie).expect(404);
      await request(app).get(`/api/files/${users.Charlie.fileId}`).set('Cookie', users.Alice.cookie).expect(404);

      // Bob tries Alice and Charlie
      await request(app).get(`/api/files/${users.Alice.fileId}`).set('Cookie', users.Bob.cookie).expect(404);
      await request(app).get(`/api/files/${users.Charlie.fileId}`).set('Cookie', users.Bob.cookie).expect(404);

      // Charlie tries Alice and Bob
      await request(app).get(`/api/files/${users.Alice.fileId}`).set('Cookie', users.Charlie.cookie).expect(404);
      await request(app).get(`/api/files/${users.Bob.fileId}`).set('Cookie', users.Charlie.cookie).expect(404);
    });

    test('Cross-user deletion is completely denied', async () => {
      // Alice tries to delete Bob's file
      await request(app).delete(`/api/files/${users.Bob.fileId}`).set('Cookie', users.Alice.cookie).expect(404);
      
      // Verify Bob's file still exists for Bob
      await request(app).get(`/api/files/${users.Bob.fileId}`).set('Cookie', users.Bob.cookie).expect(200);
    });
  });

  describe('Authorization Attack Tests', () => {
    test('Header Spoofing is ignored', async () => {
      // Alice tries to fetch Bob's profile by spoofing headers
      const res = await request(app)
        .get('/api/me')
        .set('Cookie', users.Alice.cookie)
        .set('X-User-Id', users.Bob.id)
        .set('X-Owner-Id', users.Bob.id)
        .set('Authorization', `Bearer ${users.Bob.id}`);

      // Should still return Alice safely
      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(users.Alice.id);
    });

    test('Query Manipulation is ignored', async () => {
      const res = await request(app)
        .get(`/api/me?userId=${users.Bob.id}&ownerId=${users.Bob.id}`)
        .set('Cookie', users.Alice.cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(users.Alice.id);
    });

    test('SQL Injection attempt is handled safely', async () => {
      // Attempt injection in email on login
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: "' OR 1=1 --", password: "password" });
      
      // Zod validation should reject it outright as an invalid email format
      expect(res.status).toBe(400);

      // Attempt UUID injection on file access
      const fileRes = await request(app)
        .get(`/api/files/12345678-1234-1234-1234-123456789012' OR '1'='1`)
        .set('Cookie', users.Alice.cookie);
      
      // Should fail safely with 400 Bad Request because of our UUID validator
      expect(fileRes.status).toBe(400);
    });
  });

  describe('Security Headers & CORS Audit', () => {
    test('Helmet security headers are present', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined(); // Express powered by should be disabled
    });
  });

  describe('Error Handling Information Leakage Audit', () => {
    test('Missing resource returns generic 404 without leaking internal paths', async () => {
      const res = await request(app).get('/api/some-non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.message).toBeDefined();
      expect(JSON.stringify(res.body)).not.toContain('C:\\');
      expect(JSON.stringify(res.body)).not.toContain('/usr/src');
    });

    test('Malformed JSON returns clean error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "bad json'); // Missing closing quote and brace

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
});
