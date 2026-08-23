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
- File uploads are capped at a strict maximum file size (5MB).
