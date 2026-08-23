git add package.json package-lock.json
git commit -m "deps: add node-appwrite sdk"

git add src/config/env.ts .env.example
git commit -m "config: add appwrite environment configuration"

git add src/integrations/storage/StorageProvider.ts
git commit -m "storage: define storage provider interface abstraction"

git add src/integrations/storage/LocalStorageProvider.ts
git commit -m "storage: implement backward compatible local storage provider"

git add src/integrations/appwrite/client.ts
git commit -m "appwrite: configure core appwrite server client"

git add src/integrations/appwrite/AppwriteStorageProvider.ts
git commit -m "appwrite: implement appwrite storage provider"

git add src/integrations/storage/index.ts
git commit -m "storage: create factory for resolving active storage provider"

git add tsconfig.json
git commit -m "build: update tsconfig module resolution for node-appwrite"

git add migrations/
git commit -m "db: create migration for appwrite_file_id"

git add src/services/fileService.ts
git commit -m "files: refactor upload to use generic storage provider"

git add src/services/fileService.ts
git commit -m "files: integrate appwrite storage upload flow"

git add src/services/fileService.ts
git commit -m "files: implement compensating transaction for failed db inserts"

git add src/services/fileService.ts
git commit -m "files: refactor delete flow to use storage provider"

git add src/services/fileService.ts
git commit -m "files: enforce appwrite remote object deletion on removal"

git add src/controllers/fileController.ts
git commit -m "api: update file download controller to stream from storage provider"

git add src/controllers/fileController.ts
git commit -m "api: support appwrite file streaming mechanism"

git add tests/appwrite.test.ts
git commit -m "test: add dedicated appwrite integration test suite"

git add tests/appwrite.test.ts
git commit -m "test: verify live appwrite upload download and delete lifecycle"

git add docs/appwrite.md
git commit -m "docs: write appwrite architecture and setup documentation"

git add .
git commit -m "chore: finalize master prompt 8 appwrite integration"
