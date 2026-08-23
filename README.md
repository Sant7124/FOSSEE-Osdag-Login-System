# FOSSEE Autumn 2026 Osdag Login System

This project is the complete, full-stack implementation for the FOSSEE Osdag screening task: **"Secure Login System with User Details & File Access"**.

## Architecture Overview
The project is built around a secure client-server architecture:
- **Client (Frontend):** A Single-Page Application (SPA) built with React, Vite, and TypeScript.
- **Server (Backend):** A hardened Node.js/Express API handling all authentication, authorization, and business logic.
- **Database (Supabase):** PostgreSQL used exclusively as a relational database (no BaaS features used).
- **Storage (Appwrite):** Appwrite Storage used for scalable cloud file hosting.

The backend acts as an absolute security boundary. The frontend contains zero secrets, cannot bypass authorization, and relies entirely on HttpOnly cookies for authentication.

## Authentication & Security
- **Authentication:** Stateful server-side sessions bound to 32-byte cryptographically secure UUID tokens hashed via SHA-256 for persistent database lookup.
- **Cookies:** Sessions are maintained via `HttpOnly`, `Secure`, `SameSite=Lax` cookies. The browser JavaScript has no access to the session token.
- **Passwords:** Hashed with `bcrypt` (cost 12).
- **Logout:** Sessions are explicitly revoked in the database on logout, protecting against replay attacks or compromised token storage.

## User & File System Isolation
- **User Identity:** The endpoint `/api/me` absolutely isolates users via their HTTP-only session cookie. Arbitrary user queries are strictly prohibited. The frontend uses this to determine authentication state (`AuthContext`).
- **Secure File Storage:** Files are uploaded to Appwrite Storage through the backend. The backend maps Appwrite `fileId`s to authenticated users in PostgreSQL.
- **Ownership:** The backend utilizes strict relational `WHERE file_id = $1 AND user_id = $2` clauses for file operations. Cross-user access fundamentally triggers a generic `404 Not Found` to prevent enumeration attacks.
- **Appwrite Security:** Appwrite API keys and Project IDs are maintained exclusively on the backend. The frontend never talks to Appwrite directly.

## Setup Instructions

### 1. Environment Configuration

**Backend (`custom-backend/.env`):**
```env
PORT=5050
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SESSION_SECRET=[Secure_32_Byte_Secret]
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# Appwrite Storage Credentials
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[YOUR_PROJECT_ID]
APPWRITE_API_KEY=[YOUR_API_KEY]
APPWRITE_BUCKET_ID=[YOUR_BUCKET_ID]
```

**Frontend (`client/.env`):**
No secrets are required. Vite is configured to automatically proxy `/api` requests to `http://localhost:5050` during development.

### 2. Backend Setup
```bash
cd custom-backend
npm install
npm run db:migrate  # Run database migrations
npm run dev         # Start the API server on port 5050
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev         # Start the Vite dev server on port 5173
```
Access the application at `http://localhost:5173`.

### 4. Testing Commands

**Frontend Tests (Vitest & React Testing Library):**
```bash
cd client
npm test
```
*(Executes UI component validation, authentication flow tests, and mock API assertions)*

**Backend Tests (Jest & Supertest):**
```bash
cd custom-backend
npm test
```
*(Executes isolated database integrations, authentication audits, storage integration tests, and cross-user exploitation workflows)*

## Production Build

To build the frontend for production:
```bash
cd client
npm run build
```
This produces an optimized, static bundle in the `client/dist` directory which can be served by any static hosting provider or Express static middleware.
