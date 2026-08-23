# Testing Strategy

## Philosophy
Tests must verify real behavior, not mock the underlying fundamental logic.

## Test Matrix
The test suite will cover the following scenarios:
- **Health**: \GET /health\ responds with 200 OK.
- **Authentication**:
  - Valid login creates session and returns cookie.
  - Invalid login returns 401.
  - Logout clears session.
- **Authorization & Isolation**:
  - Unauthenticated access to protected routes returns 401.
  - Authenticated user attempting to access another user's file returns 403 Forbidden.
- **File Ownership**:
  - File upload accurately assigns ownership to the current session user.

## Tools
- Jest
- Supertest
