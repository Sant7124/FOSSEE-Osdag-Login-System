# Evaluator Quick Start Guide

This guide is designed for FOSSEE evaluators to quickly and painlessly spin up the entire unified client-server architecture locally.

## Prerequisites
- **Node.js**: v20 or higher recommended.
- **npm**: v10 or higher.
- **PostgreSQL Database URL**: (Provided in submission or create a free Supabase instance).
- **Appwrite Credentials**: (Provided in submission or create a free Appwrite Cloud project).

---

## 1. Environment Setup

### Backend (.env)
Navigate to the `custom-backend` directory and duplicate the `.env.example` file to `.env`:
```bash
cd custom-backend
cp .env.example .env
```
Populate the following critical secrets inside `custom-backend/.env`:
- `DATABASE_URL` (Your PostgreSQL connection string)
- `SESSION_SECRET` (Any random 32-character string)
- `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_BUCKET_ID`

### Frontend (.env)
**No `.env` file is required for the frontend.** The Vite development server is pre-configured to proxy `/api` traffic securely to the backend on `localhost:5050`.

---

## 2. Bootstrapping the System

### Start the Backend
Open a terminal and run:
```bash
cd custom-backend
npm install
npm run db:migrate   # Automatically provisions required PostgreSQL tables
npm run dev          # Starts the Node API on http://localhost:5050
```

### Start the Frontend
Open a **second** terminal and run:
```bash
cd client
npm install
npm run dev          # Starts the Vite SPA on http://localhost:5173
```

---

## 3. Auditing the Workflow

1. **Access the Application**: Open your browser to `http://localhost:5173`.
2. **Register**: Create a new test account (e.g., `evaluator@example.com` / `SecurePass1!`).
3. **Login**: Authenticate with your new credentials.
4. **Upload a File**: Drag and drop a standard PDF or image file (under 5MB).
5. **Download**: Click the download icon to stream the binary safely through the backend proxy.
6. **Isolation Test**: Create a second user in a private browsing window. Observe that the file registry remains strictly isolated.

---

## 4. Running the Automated Test Suites

To verify the robust security configurations without manual clicking, run the test suites:

### Frontend Verification
```bash
cd client
npm test
```
*Tests UI routing, authorization state-machine logic, and form validation.*

### Backend Verification
```bash
cd custom-backend
npm test
```
*Tests Cross-User file isolation, JWT absence, SQL Injection prevention, Appwrite integration stability, and Rate Limiting.*
