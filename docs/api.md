# API Documentation

All routes exist under the base prefix `/api` (or are proxied in development via `http://localhost:5173/api`).

## Authentication Routes

### `POST /api/auth/register`
Creates a new user account.
- **Auth Required:** No
- **Body:** `{ "name": "Test User", "email": "test@example.com", "password": "StrongPassword1!" }`
- **Success (201):** `{ "status": "success", "message": "User registered successfully" }`
- **Errors:** 400 (Validation/Conflict), 429 (Rate Limit)

### `POST /api/auth/login`
Authenticates a user and sets an HttpOnly session cookie.
- **Auth Required:** No
- **Body:** `{ "email": "test@example.com", "password": "StrongPassword1!" }`
- **Success (200):** `{ "status": "success", "message": "Logged in successfully" }` (sets `session` cookie)
- **Errors:** 401 (Invalid Credentials), 429 (Rate Limit)

### `POST /api/auth/logout`
Revokes the active session and clears the browser cookie.
- **Auth Required:** No (Safely fails if unauthenticated)
- **Success (200):** `{ "status": "success", "message": "Logged out successfully" }`

---

## User Routes

### `GET /api/me`
Retrieves the currently authenticated user's profile.
- **Auth Required:** Yes (Valid HttpOnly `session` cookie)
- **Success (200):** 
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "uuid",
        "name": "Test User",
        "email": "test@example.com",
        "created_at": "ISO8601"
      }
    }
  }
  ```
- **Errors:** 401 (Unauthorized - Session missing, invalid, or revoked)

---

## File Routes

### `GET /api/files`
Lists all files owned strictly by the authenticated user.
- **Auth Required:** Yes
- **Success (200):**
  ```json
  {
    "status": "success",
    "data": {
      "files": [
        {
          "id": "uuid",
          "original_name": "document.pdf",
          "mime_type": "application/pdf",
          "size_bytes": 10245,
          "created_at": "ISO8601"
        }
      ]
    }
  }
  ```
- **Errors:** 401 (Unauthorized)

### `POST /api/files`
Uploads a file to the secure storage architecture.
- **Auth Required:** Yes
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `file` (Binary file data, max 5MB)
- **Success (201):** `{ "status": "success", "data": { "file": { ...metadata } } }`
- **Errors:** 400 (Invalid file/Too large), 401 (Unauthorized), 429 (Rate Limit)

### `GET /api/files/:id`
Streams a specific file's binary data back to the client.
- **Auth Required:** Yes (Must own the file)
- **Success (200):** Raw binary blob data with appropriate `Content-Type` and `Content-Disposition`.
- **Errors:** 401 (Unauthorized), 404 (Not Found / Unauthorized Ownership)

### `DELETE /api/files/:id`
Permanently deletes a file from both Appwrite Storage and the PostgreSQL metadata layer.
- **Auth Required:** Yes (Must own the file)
- **Success (200):** `{ "status": "success", "message": "File deleted successfully" }`
- **Errors:** 401 (Unauthorized), 404 (Not Found / Unauthorized Ownership)
