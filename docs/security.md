# Security Philosophy and Policies

## Fundamental Rule
**AUTHENTICATED USER → ONLY THEIR OWN DATA**
A user must only be able to access files and profile information that belong directly to them.

## Data Isolation
- Authorization logic relies strictly on the server-session derived identity.
- Client-provided identifiers are untrusted and discarded for auth decisions.

## Passwords
- All passwords are hashed using bcrypt with salt.

## Security Headers
- Helmet is utilized for essential security headers.
- CORS is configured explicitly.

## Denial of Service Protection
- Basic rate limiting is applied globally via express-rate-limit.
- Registration and Login have dedicated rate limiters to prevent brute force and abuse.
- File uploads are capped at a strict maximum file size (5MB).

## Authentication & Sessions
- **No JWT**: We intentionally use Server-Side Sessions instead of JWTs to enable instantaneous revocation and absolute server-side control over active sessions.
- **Session Tokens**: Sessions are tracked via a cryptographically secure 32-byte opaque token. The raw token is sent to the client, while a SHA-256 hash of the token is stored in the database (`token_hash`). This prevents database leaks from immediately exposing active sessions.
- **Cookie Security**: The session token is transmitted exclusively via an `HttpOnly`, `SameSite=Lax` secure cookie. It is never exposed to frontend JavaScript.
- **Expiration and Revocation**: Sessions have an absolute hard expiry (7 days) in `expires_at`. Logout explicitly sets `revoked_at`, guaranteeing the session is permanently dead even if the cookie is intercepted.
- **Account Enumeration**: Login failures (wrong password vs unknown email) return the exact same generic error message (`Invalid email or password`) to prevent enumeration attacks.

## Identity Isolation
- **Authentication vs Identity**: Authentication proves "who are you" via session. The endpoint `/api/me` strictly fetches information corresponding to the authenticated identity.
- **Zero Trust**: Client-supplied user identifiers (like `req.body.userId`, query parameters, or fake custom headers) are inherently untrusted and explicitly ignored.
- **Absolute Isolation**: Authenticated User A can NEVER select or query User B's profile via `/api/me` because the query strictly enforces `WHERE id = $1`, where `$1` is guaranteed to be `req.user.id` from the secure session context.
