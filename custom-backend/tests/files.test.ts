import request from 'supertest';
import app from '../src/app';
import { db, pool } from '../src/db';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs/promises';

jest.setTimeout(30000);

describe('Secure File System Tests', () => {
  const users = [
    { name: 'File User A', email: `fa_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '' },
    { name: 'File User B', email: `fb_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '' },
    { name: 'File User C', email: `fc_${Date.now()}@example.com`, password: 'SecurePassword123!', id: '', cookie: '' }
  ];

  const testFiles = {
    A: { id: '' },
    B: { id: '' },
    C: { id: '' }
  };

  const DUMMY_FILE_CONTENT = Buffer.from('Hello secure world');

  beforeAll(async () => {
    // Setup users and cookies
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('SecurePassword123!', salt);

    for (const u of users) {
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [u.name, u.email, hash]
      );
      u.id = result.rows[0].id;

      const loginRes = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
      const cookies = loginRes.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      u.cookie = cookieArray.find((c: string) => c.startsWith('session=')).split(';')[0];
    }
  });

  afterAll(async () => {
    // Clean DB
    for (const u of users) {
      await db.query('DELETE FROM users WHERE id = $1', [u.id]);
    }
    await pool.end();
    
    // Clean uploads directory
    try {
      await fs.rm(path.resolve(process.env.UPLOAD_DIR || 'uploads'), { recursive: true, force: true });
    } catch(e) {}
  });

  describe('Upload Tests', () => {
    test('Unauthenticated upload fails', async () => {
      const res = await request(app).post('/api/files').attach('file', DUMMY_FILE_CONTENT, 'test.txt');
      expect(res.status).toBe(401);
    });

    test('Unsupported file type fails', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', users[0].cookie)
        .attach('file', DUMMY_FILE_CONTENT, { filename: 'test.sh', contentType: 'application/x-sh' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Unsupported file type');
    });

    test('User A can upload file successfully', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', users[0].cookie)
        .attach('file', DUMMY_FILE_CONTENT, { filename: 'fileA.txt', contentType: 'text/plain' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.file.originalName).toBe('fileA.txt');
      expect(res.body.data.file).toHaveProperty('id');
      expect(res.body.data.file).not.toHaveProperty('storage_path');
      
      testFiles.A.id = res.body.data.file.id;
    });

    test('User B can upload file successfully', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', users[1].cookie)
        .attach('file', DUMMY_FILE_CONTENT, { filename: 'fileB.txt', contentType: 'text/plain' });
      testFiles.B.id = res.body.data.file.id;
    });

    test('User C can upload file successfully', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', users[2].cookie)
        .attach('file', DUMMY_FILE_CONTENT, { filename: 'fileC.txt', contentType: 'text/plain' });
      testFiles.C.id = res.body.data.file.id;
    });
    
    test('User ID Tampering (Attacker specifies another owner)', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', users[0].cookie) // A logs in
        .field('userId', users[1].id) // A attempts to inject B's ID
        .attach('file', DUMMY_FILE_CONTENT, { filename: 'tamper.txt', contentType: 'text/plain' });

      // Ensure the file is STILL owned by User A, ignoring the attacker payload
      expect(res.status).toBe(201);
      
      const dbCheck = await db.query('SELECT user_id FROM files WHERE id = $1', [res.body.data.file.id]);
      expect(dbCheck.rows[0].user_id).toBe(users[0].id);
      expect(dbCheck.rows[0].user_id).not.toBe(users[1].id);
    });
  });

  describe('Isolation and Authorization Tests (Three-User Mandatory Test)', () => {
    test('User A sees only their files', async () => {
      const res = await request(app).get('/api/files').set('Cookie', users[0].cookie);
      expect(res.status).toBe(200);
      const fileIds = res.body.data.files.map((f: any) => f.id);
      expect(fileIds).toContain(testFiles.A.id);
      expect(fileIds).not.toContain(testFiles.B.id);
      expect(fileIds).not.toContain(testFiles.C.id);
    });

    test('User A CANNOT access User B or User C files', async () => {
      const resB = await request(app).get(`/api/files/${testFiles.B.id}`).set('Cookie', users[0].cookie);
      expect(resB.status).toBe(404);
      
      const resC = await request(app).get(`/api/files/${testFiles.C.id}`).set('Cookie', users[0].cookie);
      expect(resC.status).toBe(404);
    });

    test('User B CANNOT access User A or User C files', async () => {
      const resA = await request(app).get(`/api/files/${testFiles.A.id}`).set('Cookie', users[1].cookie);
      expect(resA.status).toBe(404);
      
      const resC = await request(app).get(`/api/files/${testFiles.C.id}`).set('Cookie', users[1].cookie);
      expect(resC.status).toBe(404);
    });

    test('User C CANNOT access User A or User B files', async () => {
      const resA = await request(app).get(`/api/files/${testFiles.A.id}`).set('Cookie', users[2].cookie);
      expect(resA.status).toBe(404);
      
      const resB = await request(app).get(`/api/files/${testFiles.B.id}`).set('Cookie', users[2].cookie);
      expect(resB.status).toBe(404);
    });

    test('Owner CAN access their own file safely', async () => {
      const res = await request(app).get(`/api/files/${testFiles.A.id}`).set('Cookie', users[0].cookie);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/plain');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toBe('Hello secure world');
    });
  });

  describe('Path Traversal Tests', () => {
    test('Path traversal in original filename is scrubbed from physical storage safely', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', users[0].cookie)
        .attach('file', DUMMY_FILE_CONTENT, { filename: '../../../etc/passwd.txt', contentType: 'text/plain' });
      
      expect(res.status).toBe(201);
      
      // Ensure it doesn't break downloading due to header injection
      const getRes = await request(app).get(`/api/files/${res.body.data.file.id}`).set('Cookie', users[0].cookie);
      expect(getRes.status).toBe(200);
      
      // Filename should be sanitized in header
      expect(getRes.headers['content-disposition']).not.toContain('/');
      expect(getRes.headers['content-disposition']).not.toContain('\\');
    });
  });

  describe('Concurrent User Isolation', () => {
    test('Concurrent requests remain strictly isolated', async () => {
      const reqA = request(app).get(`/api/files/${testFiles.A.id}`).set('Cookie', users[0].cookie);
      const reqB = request(app).get(`/api/files/${testFiles.B.id}`).set('Cookie', users[1].cookie);
      const reqC = request(app).get(`/api/files/${testFiles.C.id}`).set('Cookie', users[2].cookie);

      const [resA, resB, resC] = await Promise.all([reqA, reqB, reqC]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resC.status).toBe(200);
    });
  });

  describe('Delete Tests', () => {
    test('User B CANNOT delete User A file', async () => {
      const res = await request(app).delete(`/api/files/${testFiles.A.id}`).set('Cookie', users[1].cookie);
      expect(res.status).toBe(404); // Leaks no info
    });

    test('User A CAN delete their own file', async () => {
      const res = await request(app).delete(`/api/files/${testFiles.A.id}`).set('Cookie', users[0].cookie);
      expect(res.status).toBe(200);

      // Verify deletion in DB
      const dbCheck = await db.query('SELECT * FROM files WHERE id = $1', [testFiles.A.id]);
      expect(dbCheck.rows.length).toBe(0);
    });
    
    test('User A CANNOT access deleted file', async () => {
      const res = await request(app).get(`/api/files/${testFiles.A.id}`).set('Cookie', users[0].cookie);
      expect(res.status).toBe(404);
    });
  });
});
