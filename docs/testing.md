# Testing Strategy

## Philosophy
Tests must verify real behavior, not mock the underlying fundamental logic.

## Test Matrix
The test suite will cover the following scenarios:
- **Health**: \GET /health\ responds with 200 OK.
- **Authentication**:
  - Valid login creates session, hashes token, sets HTTP-only cookie, and returns safe user JSON.
  - Invalid login (wrong password or unknown email) returns identical 401 response.
  - Multiple sessions successfully supported independently.
  - Logout sets `revoked_at` in DB and clears cookie. Reusing the old cookie actively fails.
  - Expired, non-existent, or revoked sessions result in immediate rejection by authMiddleware.
- **Registration**:
  - Valid registration creates user, returns safe response without password hash.
  - Duplicate registration (same email or different casing) returns 409 safely.
  - Missing or weak parameters rejected with 400.
  - SQL injection payloads sanitized and treated literally.
  - Extra unapproved fields strictly rejected by Zod validation.
- **Authorization & Isolation**:
  - Unauthenticated access to protected routes returns 401.
  - Authenticated user attempting to access another user's file returns 403 Forbidden.
- **File Ownership**:
  - File upload accurately assigns ownership to the current session user.

## Tools
- Jest
- Supertest
