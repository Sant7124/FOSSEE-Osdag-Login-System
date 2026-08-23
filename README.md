# FOSSEE Osdag Login System

## Project Purpose
The FOSSEE Autumn 2026 Osdag screening-task submission.
A Secure Login System with User Details & File Access.

## FOSSEE Task Summary
Building a dual-implementation secure backend system containing:
- Implementation A: Custom Backend (Node.js, Express, PostgreSQL)
- Implementation B: Managed Backend (Appwrite)
- Both implementing secure authentication, user isolation, and file access.

## Planned Architecture
The system enforces strict security policies where authenticated users can only access their own data.
See docs/architecture.md for details.

## Planned Technologies
- Node.js
- Express.js
- PostgreSQL
- TypeScript

## Project Structure
- /custom-backend: Node.js based custom backend
- /appwrite: Managed backend setup
- /client: Frontend client
- /docs: Technical documentation

## Development Roadmap
Phase 1: Project foundation and architecture (Completed)
Phase 2: Custom backend development
Phase 3: Database and ORM setup
Phase 4: Appwrite integration

## Security Philosophy
Strict zero-trust for client-provided IDs. The server must derive the authenticated identity from the secure HTTP-only session cookie.
