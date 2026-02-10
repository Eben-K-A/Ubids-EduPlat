# Rollout Strategy

- Use rolling updates with readiness/liveness probes.
- Prefer canary releases for major changes.
- Apply database migrations before app deployment.
- Use HPA for peak exam traffic.
