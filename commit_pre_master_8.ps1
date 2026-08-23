git add custom-backend/src/app.ts custom-backend/src/routes/authRoutes.ts custom-backend/src/routes/fileRoutes.ts custom-backend/tests/rateLimit.test.ts
git commit -m "test: isolate rate limiter tests without compromising production security"

git add custom-backend/src/controllers/fileController.ts custom-backend/tests/security.test.ts
git commit -m "security: validate file ids format to safely return 400 instead of 500 on invalid input"

git push origin main
