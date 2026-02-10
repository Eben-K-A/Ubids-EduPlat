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

## Observability
OTLP traces are enabled when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.

## AI Providers
Supported providers: OpenAI, DeepSeek, Hugging Face.
Set `AI_DEFAULT_PROVIDER` and provider keys in `.env`.

## Tests
- Unit: `npm run test`
- E2E: `npm run test:e2e`
- Load (k6): `k6 run test/load/k6-smoke.js`

## Kubernetes
Manifests are in `backend/deploy/k8s`.
Apply in order: `namespace.yaml`, `configmap.yaml`, `secret.yaml`, `deployment.yaml`, `service.yaml`, `hpa.yaml`, `ingress.yaml`.
Monitoring: `monitoring-prometheus.yaml`, `monitoring-grafana.yaml`, `alert-rules.yaml`, `grafana-datasource.yaml`, `grafana-dashboard-provisioning.yaml`, `grafana-dashboard-cm.yaml`.

## Key Modules
- Auth + Users
- Courses
- Assignments
- Files
- Realtime
- AI
- Analytics
- Audit
