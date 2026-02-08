# UBIDS EduPlat

A full-stack educational platform.

## Frontend
- Vite + React + TypeScript
- Located in `src/`

Run:
```
npm install
npm run dev
```

## Backend
- NestJS + PostgreSQL + Redis
- Located in `backend/`

Run:
```
cd backend
npm install
npm run start:dev
```

Docker (backend + Postgres + Redis):
```
cd backend
docker compose -f docker/docker-compose.yml up -d
```
