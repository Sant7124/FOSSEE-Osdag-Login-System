# Appwrite Storage Integration Architecture

This document describes the architectural implementation for securely storing user files in Appwrite while maintaining PostgreSQL as the primary source of truth.

## 1. Core Principles

1. **Authentication:** All users authenticate directly against the custom backend (PostgreSQL + Sessions). Appwrite authentication is NOT used.
2. **Authorization:** The custom backend maintains strict relational isolation mapping users to files. File retrieval queries `files` table ensuring ownership *before* hitting Appwrite.
3. **Secrecy:** The `APPWRITE_API_KEY` operates as a Server API Key. It must never reach the browser client.

## 2. Configuration Setup

The backend expects the following environment variables. They should be configured in `.env`:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[Your_Project_ID]
APPWRITE_API_KEY=[Your_Server_API_Key]
APPWRITE_BUCKET_ID=[Your_Storage_Bucket_ID]
```

### Appwrite Dashboard Preparation:
1. **Create Project**: Log into Appwrite and create a project. Note the Project ID.
2. **Create Bucket**: Under Storage, create a bucket. Note the Bucket ID.
3. **Permissions**: The Appwrite bucket requires **NO** public read or write permissions. The server SDK completely bypasses bucket-level roles.
4. **Create API Key**: Under Overview -> Integrations -> API Keys, create a Server Key. Check the `files.read`, `files.write` scopes. Note the Key Secret.

## 3. Storage Abstraction Layer & Download Behavior

Files are routed through the `StorageProvider` interface (`src/integrations/storage/StorageProvider.ts`).

- `LocalStorageProvider`: Retains backward compatibility by writing files directly to the node filesystem (`uploads/`).
- `AppwriteStorageProvider`: Actively leverages the `node-appwrite` SDK.

**Download Memory Behavior:**
The current `AppwriteStorageProvider` implementation obtains the file from the Appwrite server SDK (`getFileDownload()`), which buffers the response as an `ArrayBuffer` in memory *before* writing it to the Express Response stream. Because the application strictly enforces a `5 MB` maximum upload size before storage access, this memory-buffering approach remains safe, simple, and entirely appropriate for the current scale. A future high-scale implementation could opt to proxy the connection or use a natively chunked, streaming-compatible storage API to reduce server memory footprint if file size limits are increased significantly.

The active provider is dynamically resolved at runtime in `src/integrations/storage/index.ts` depending on the presence of Appwrite configuration credentials.

## 4. Object Mapping

When a file is uploaded, a custom backend UUID is generated. This ID acts as:
- The Primary Key for the PostgreSQL `files` record.
- The `appwrite_file_id` (The literal Appwrite Object ID).

### Upload Compensating Transaction
If an Appwrite upload completes but the PostgreSQL insert fails, a cleanup process immediately dispatches an Appwrite delete operation to prevent orphaned objects in the bucket.

## 5. Security & Browser Constraints

Because the browser must not hold the API Key, all uploads utilize:
```text
Browser --(Multipart HTTP)--> Node.js --(node-appwrite)--> Appwrite
```
Downloads reverse this flow, streaming the buffer securely back to the browser.
