# System Architecture

## Implementations
The project consists of two implementations serving the exact same frontend API contract:

1. **Custom Backend** (Node.js, Express, PostgreSQL)
2. **Managed Backend** (Appwrite)

## Authentication Approach (Custom Backend)
- **Mechanism**: Server-side sessions with HTTP-Only Secure Cookies.
- **Flow**:
  1. Login: Server validates credentials, creates a session in DB, returns session ID via secure cookie.
  2. Authenticated Requests: Middleware reads cookie, validates session in DB, attaches user identity.
  3. Logout: Server destroys session in DB and clears client cookie.
- **Security Rule**: NEVER trust client-provided User IDs for authorization. Authenticated user ID is derived strictly from the server-validated session.

## Database Role
- Uses PostgreSQL.
- Stores: Users, Sessions, and File Metadata (ownership).
- Production target: Supabase PostgreSQL.

## File Storage Role
- Files are stored on disk inside uploads/users/{user_id}/.
- File metadata is stored in PostgreSQL.
- Only authenticated requests can access files, protected by an endpoint validating ownership.
- Future Appwrite implementation will use Appwrite Storage with Document Level Security (Permissions).
