git add custom-backend/package.json custom-backend/package-lock.json
git commit -m "deps: add node-appwrite sdk"

git add custom-backend/src/config/env.ts custom-backend/.env.example
git commit -m "config: add appwrite environment configuration"

git add custom-backend/src/integrations/storage/StorageProvider.ts
git commit -m "storage: define storage provider interface abstraction"

git add custom-backend/src/integrations/storage/LocalStorageProvider.ts
git commit -m "storage: implement backward compatible local storage provider"

git add custom-backend/src/integrations/appwrite/client.ts
git commit -m "appwrite: configure core appwrite server client"

git add custom-backend/src/integrations/appwrite/AppwriteStorageProvider.ts
git commit -m "appwrite: implement appwrite storage provider"

git add custom-backend/src/integrations/storage/index.ts
git commit -m "storage: create factory for resolving active storage provider"

git add custom-backend/tsconfig.json
git commit -m "build: update tsconfig module resolution for node-appwrite"

git add custom-backend/migrations/
git commit -m "db: create migration for appwrite_file_id"

git add custom-backend/src/services/fileService.ts
git commit -m "files: integrate appwrite storage upload flow and compensating transaction"

git add custom-backend/src/controllers/fileController.ts
git commit -m "api: update file download controller to stream from storage provider"

git add custom-backend/tests/appwrite.test.ts
git commit -m "test: add dedicated appwrite integration test suite"

git add custom-backend/tests/production-storage.test.ts
git commit -m "test: verify production storage configuration"

git add docs/appwrite.md
git commit -m "docs: write appwrite architecture and setup documentation"

git add commit_phase8.ps1 commit_pre_master_9.ps1
git commit -m "chore: add commit helper scripts"

git add .
git commit -m "chore: finalize master prompt 8 and pre-master 9 fixes"
