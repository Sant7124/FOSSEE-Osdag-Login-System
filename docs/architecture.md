# System Architecture

The FOSSEE Autumn 2026 Osdag Login System is designed with an explicit hierarchy that ensures complete separation of concerns and robust security boundaries.

## High-Level Flow

```mermaid
flowchart TD
    A[Browser (React SPA)] -->|HTTPS / API Requests| B[Node/Express Backend]
    B -->|Authorization & Metadata| C[(PostgreSQL/Supabase)]
    B -->|Binary Storage| D[(Appwrite Storage)]
```

## 1. Browser Client (React/Vite)
- **Role:** Stateless presentation layer.
- **Security:** Contains ZERO secrets, JWTs, or backend credentials.
- **Authentication:** Relies exclusively on `HttpOnly`, `Secure` cookies managed automatically by the browser. 
- **Routing:** Public and Protected routes dynamically pivot based on the active user profile returned by the `/api/me` heartbeat.

## 2. Node/Express Backend (The Security Boundary)
- **Role:** The singular source of truth for authorization, rate limiting, validation, and storage orchestration.
- **Authentication Layer:** Provisions cryptographically secure 32-byte session UUIDs mapped in the database. Hashes passwords using `bcrypt`.
- **User Service:** Strict isolation enforcing that a user's session dictates exactly which profile they retrieve.
- **File Service:** Processes incoming `multipart/form-data`, validates payloads against limits (5MB) and type restrictions, and orchestrates Appwrite ingestion.

## 3. PostgreSQL Database (Supabase)
- **Role:** The definitive relational metadata layer.
- **Tables:** `users`, `sessions`, `files`.
- **Why PostgreSQL dictates ownership over Appwrite:** Appwrite is highly capable, but to satisfy the stringent custom-backend constraints of the FOSSEE assignment, the custom API must own all metadata. Appwrite merely acts as a dumb binary blob store, while PostgreSQL maps the Appwrite `fileId` to the authenticated user. This prevents Appwrite's internal rule engines from circumventing the custom backend's custom authorization logic.

## 4. Appwrite Storage
- **Role:** Scalable cloud object storage.
- **Security:** Locked down completely. Requires the internal `APPWRITE_API_KEY` (kept strictly in the backend `.env`). No public browser-level access is allowed.
