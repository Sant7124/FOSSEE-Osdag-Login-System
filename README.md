# FOSSEE Autumn 2026 Osdag Login System

This project is the custom backend implementation for the FOSSEE Osdag screening task: **"Secure Login System with User Details & File Access"**.

## Architecture Overview
The project is built around a dual-implementation model:
1. **Implementation A (Custom Backend)**: Node.js, Express, PostgreSQL, robust security measures, and local file storage. (Currently active)
2. **Implementation B (Managed Backend)**: Appwrite stack. (Upcoming)

This repository strictly houses Implementation A as per the phase constraints. 
The custom backend operates entirely on its own authorization constraints, database, and infrastructure. No ORMs (e.g., Prisma, TypeORM) are utilized; raw SQL is dispatched through `pg` to maximize transparency and SQL competence.

## Database & Authentication
- **Database**: PostgreSQL (hosted on Supabase, purely as a standard PG cluster).
- **Authentication**: Stateful server-side sessions bound to 32-byte cryptographically secure UUID tokens hashed via SHA-256 for persistent database lookup.
- **Passwords**: Hashed with `bcrypt` (cost 12).
- **Security**: No JWTs. Sessions are revokable on logout, protecting against replay attacks or compromised token storage.

## User & File System Isolation
- **User Identity**: The endpoint `/api/me` absolutely isolates users via their HTTP-only session cookie. Arbitrary user queries are strictly prohibited.
- **Secure File Storage**: Files are localized under `uploads/users/:userId/:storedName`. Path traversal is defended by strict validation logic.
- **Ownership**: The backend utilizes strict relational `WHERE file_id = $1 AND user_id = $2` clauses for file operations. Cross-user access fundamentally triggers a generic `404 Not Found` to prevent timing or enumeration attacks.

## Security Audit
The latest phase (Phase 7) concluded a comprehensive security hardening audit:
- Graceful shutdown handles orphaned Node server and PG connection pools effectively.
- Express-rate-limit defends against brute forcing and abuse.
- `helmet` controls strict HTTP security headers (CSP, X-Frame-Options, DNS Prefetch).
- Inputs are rigorously typed via `zod`.
- Error outputs purposefully scrub stack traces, SQL syntax, or filesystem paths.
- Global request payloads capped at 10kb; Multipart uploads capped at 5MB.

## Testing Strategy
- Utilizes `jest` and `supertest`.
- Extensive coverage across Auth API, File isolation, Database validation, and security exploitation attempts (e.g., header spoofing, path manipulation).
- Test environment dynamically scopes rate limiters and pool configurations to maximize concurrency safety on free-tier DB constraints.

## Setup Instructions

### Environment Variables
Create a `.env` in `custom-backend/`:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.erhwgelmgtpgpeztyizf.supabase.co:5432/postgres
SESSION_SECRET=[Secure_32_Byte_Secret]
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```

### Running the API
```bash
cd custom-backend
npm install
npm run dev
```

### Testing the API
```bash
cd custom-backend
npm test
```
*(Executes isolated database integrations, authentication audits, and cross-user exploitation workflows)*
