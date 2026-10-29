# Deployment and Rollout Strategy

This document defines the deployment methodology, zero-downtime rolling updates, database migration sequencing, and automated rollback protocols for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Zero-Downtime Deployment Methodology

The platform implements a **Rolling Update / Blue-Green Deployment** strategy to ensure that schools experience zero service interruption during scheduled production updates:

```mermaid
sequenceDiagram
    participant CI as CD Pipeline
    participant DB as Managed PostgreSQL
    participant LB as Application Load Balancer
    participant Old as Running Container Fleet (V1)
    participant New as New Container Fleet (V2)

    CI->>DB: 1. Apply Backward-Compatible Schema Migrations (Expand Phase)
    DB-->>CI: Migration Successful
    CI->>New: 2. Spin Up New Containers with Application V2
    New->>New: 3. Boot & Pass /api/v1/health/readiness check
    CI->>LB: 4. Register V2 instances & begin health check routing
    LB->>New: 5. Route 10% Canary traffic -> monitor error rates
    LB->>New: 6. Shift 100% traffic to V2 fleet
    CI->>LB: 7. Deregister Old V1 instances
    CI->>Old: 8. Send SIGTERM -> Graceful draining (10s window) -> Terminate V1
```

---

## 2. Database Migration Sequencing

Database migrations must never run simultaneously with application code that expects the old schema. We enforce a strict 3-step migration sequence:

1. **Pre-Deployment Migrations (Expand)**:
   - Executed before any new container instances boot.
   - Limited strictly to non-breaking, additive changes: creating new tables, adding nullable columns, creating new indexes.
2. **Container Promotion**:
   - New container instances boot, pass health checks, and begin serving user traffic.
3. **Post-Deployment Migrations (Contract)**:
   - Executed in a subsequent maintenance release after the old code is completely decommissioned.
   - Drops deprecated columns, adds `NOT NULL` constraints to backfilled fields.

---

## 3. Automated Rollback Triggers

The deployment orchestrator automatically aborts promotion and reverts traffic to the previous healthy container fleet if any of the following triggers fire:

- **Readiness Probe Failure**: New container fails to respond `200 OK` on `/api/v1/health/readiness` within 60 seconds of boot.
- **Error Spike**: HTTP $5xx$ error rate exceeds $0.5\%$ of total traffic during the first 5 minutes of canary routing.
- **Latency Anomaly**: P95 response latency on transactional endpoints exceeds $500\text{ ms}$ during canary routing.
- **Manual Abort**: Authorized lead cancels deployment via CD management interface.
