git add src/integrations/storage/index.ts
git commit -m "security: fail closed on production storage"

git add tests/production-storage.test.ts
git commit -m "test: verify production storage configuration"

git add docs/appwrite.md
git commit -m "docs: document appwrite download behavior"

git add .
git commit -m "test: run appwrite regression"
