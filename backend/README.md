# UBIDS EduPlat Backend

Production-oriented NestJS backend with Clean Architecture boundaries.

## Quick Start
1. Copy `.env.example` to `.env` and update secrets.
2. Start dependencies.

```
cd backend
docker compose -f docker/docker-compose.yml up -d
```

3. Run the API.

```
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```

## API
- Base URL: `/api/v1`
- Swagger: `/api/docs`
- Health: `/api/v1/health/liveness`, `/api/v1/health/readiness`

## File Storage
Set `FILE_STORAGE_DRIVER` to `local` or `s3`. When using `s3`, configure bucket and credentials in `.env`.

## Key Modules
- Auth + Users
- Courses
- Assignments
- Files
- Realtime
- AI
- Analytics
- Audit
