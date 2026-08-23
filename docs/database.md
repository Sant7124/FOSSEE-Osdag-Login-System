# Database Documentation

## Overview
The custom backend implementation utilizes PostgreSQL (hosted by Supabase). 
The database serves as the source of truth for the application state. It enforces data integrity, relationships, and uniqueness using native SQL features.

## Entity Relationship Overview

```mermaid
erDiagram
    users ||--o{ sessions : has
    users ||--o{ files : owns

    users {
        UUID id PK
        CITEXT email UK
        VARCHAR password_hash
        VARCHAR name
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    sessions {
        UUID id PK
        UUID user_id FK
        TIMESTAMP expires_at
        TIMESTAMP created_at
        TIMESTAMP last_used_at
        TIMESTAMP revoked_at
    }

    files {
        UUID id PK
        UUID user_id FK
        VARCHAR original_name
        VARCHAR stored_name UK
        VARCHAR mime_type
        BIGINT size
        VARCHAR storage_path
        TIMESTAMP created_at
    }
```

## Connection Architecture
The application connects to PostgreSQL using the `pg` driver and a `Pool` instance. The connection pool manages multiple simultaneous connections to improve performance. The `DATABASE_URL` is provided securely through environment variables and is never checked into source control. 

## Migration Strategy
We use `node-pg-migrate` to manage deterministic, raw SQL migrations. Every schema change is represented as an UP/DOWN migration script in the `migrations/` directory.

## Constraints & Security
- `user_id` is the fundamental ownership reference across all tables.
- Foreign Keys use `ON DELETE CASCADE` to prevent orphaned files or sessions when a user is deleted.
- Emails are stored as `CITEXT` to provide case-insensitive uniqueness at the database level.
- Authentication secrets are isolated to `password_hash`. Plaintext passwords are NEVER stored.
- Explicit `CHECK (size > 0)` constraint exists on files to prevent zero-byte garbage entries.
