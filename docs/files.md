# Secure User File System Architecture

## Overview
This document describes the design and security of the CUSTOM BACKEND file system, strictly adhering to the requirements of the FOSSEE Autumn 2026 Osdag screening task.

## Important Limitation
**Local filesystem storage is intentionally used for this screening implementation.** 
A production, multi-instance deployment would naturally use durable object storage such as Amazon S3, Google Cloud Storage, or Appwrite Storage. Local storage was explicitly chosen here to demonstrate the raw architectural requirements of a secure file-access layer without relying on third-party cloud SDK magic.

## Storage Architecture
Files are stored locally in the `uploads/` directory, managed via an environment variable `UPLOAD_DIR`.

```
custom-backend/
    uploads/
        users/
            [USER_ID_A]/
                [GENERATED_UUID_1]
                [GENERATED_UUID_2]
            [USER_ID_B]/
                [GENERATED_UUID_3]
```
The `uploads/` directory is explicitly excluded from version control and is **never** exposed via an Express static file server.

## File Metadata & Consistency
All metadata resides in PostgreSQL (`files` table).
When uploading:
1. Validate MIME type and size (Max 5MB).
2. Generate a secure random UUID as the `stored_name`.
3. Save physical file to `uploads/users/:userId/:storedName`.
4. Insert row into PostgreSQL.
5. If the database insert fails, the orphaned physical file is explicitly deleted.

## Ownership and Isolation
**File IDs are identifiers, not authorization. Authorization is enforced by combining the requested file ID with the authenticated user's ID.**

The central authorization rule for any file access (Read, Download, Delete) is:
```sql
SELECT * FROM files WHERE id = $1 AND user_id = $2
```
Where `$1` is the requested file ID, and `$2` is the implicitly trusted `req.user.id` derived from the session middleware.

A client attempting to request or delete another user's file receives a generic `404 Not Found` rather than a `403 Forbidden`, preventing resource existence enumeration.

## Path Traversal Protection
Original filenames provided by the client are strictly treated as untrusted metadata.
- They are NEVER used as the physical storage filename.
- When retrieving files via `Content-Disposition`, the filename is thoroughly sanitized (`originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_')`) to prevent header injection.
- The backend verifies that the final resolved storage path strictly resides inside the user's specific directory using absolute prefix matching.

## Download Flow
Files are streamed to the client using `fs.createReadStream` to avoid loading massive blocks into server memory. The `Content-Disposition` is deliberately set to `attachment` to encourage downloading over potentially unsafe inline browser execution of arbitrary user-uploaded media.
