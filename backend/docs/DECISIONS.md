# Architecture Decisions

## ADR-001: Modular Monolith with Future Microservice Extraction
- Start as a modular monolith for delivery speed and consistency.
- Clear bounded contexts allow extraction later without rework.

## ADR-002: Postgres as System of Record
- Relational model for academic data with strong consistency.
- Prepared for read replicas and sharding.

## ADR-003: Redis for Cache, Rate Limiting, and Queues
- Single Redis cluster handles cache and BullMQ queues.
- Enables horizontal scaling with stateless services.

## ADR-004: JWT Access + Refresh Tokens
- Short-lived access tokens, long-lived refresh tokens.
- Refresh token rotation with server-side revocation.

## ADR-005: Background Jobs for Heavy/Async Work
- AI integration and notifications are queued in BullMQ.
- Core academic workflows remain synchronous and resilient.
