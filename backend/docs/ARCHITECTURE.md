# UBIDS EduPlat Backend Architecture

## Goals
- Horizontally scalable, stateless services
- Clean Architecture + DDD boundaries
- Strong security and auditability
- Long-term maintainability and evolvability

## High-Level Structure
- `src/modules/*` are bounded contexts designed for future microservice extraction.
- Each module has `domain`, `application`, and `presentation` layers.
- Infrastructure concerns live under `src/infra` and `src/database`.

## Core Domains
- Auth + Users
- Courses + Enrollments
- Assignments + Submissions
- Files
- Realtime (chat + signaling)
- AI (external dependency)
- Analytics + Reporting
- Audit Logging

## Key Non-Functional Features
- JWT access + refresh tokens
- Redis caching and coordination
- BullMQ for background jobs
- Rate limiting with Throttler
- Structured logging with Pino
- Health/readiness endpoints

## Scaling Strategy
- Stateless API behind L7 load balancers
- PostgreSQL read replicas and future sharding
- Redis for cache, rate limiting, job queues
- WebSocket gateways scale horizontally with Redis adapter
- File storage supports local or S3 with signed URLs and scan hooks
- Prometheus-compatible metrics exposed at `/api/v1/metrics`
 - AI provider router supports OpenAI/DeepSeek/Hugging Face via HTTP adapters

## Extensibility
- Each module can be extracted into its own service.
- Explicit boundaries avoid cross-domain coupling.
- External integrations (AI, file storage) are abstracted behind services.
