# Operational Runbooks Catalog

This index catalogs the standard operating runbooks (SOPs) for maintaining, diagnosing, and recovering the **FSD-SDG-4 Quality Education SaaS** production infrastructure.

---

## 1. Runbook Catalog Index

| Runbook ID                                          | Title                               | Primary Owner      | Scenario / Trigger                                               | Target Execution Time |
| :-------------------------------------------------- | :---------------------------------- | :----------------- | :--------------------------------------------------------------- | :-------------------: |
| [**RB-01**](#rb-01-database-point-in-time-recovery) | Database Point-in-Time Recovery     | Yashwardhan        | Data corruption, accidental table drop, or region disaster.      |  $\le 60\text{ min}$  |
| [**RB-02**](#rb-02-emergency-container-rollback)    | Emergency Container Rollback        | Vivek              | Severe defect or error spike detected immediately post-deploy.   |  $\le 5\text{ min}$   |
| [**RB-03**](#rb-03-tenant-onboarding)               | School Tenant Initial Provisioning  | Vivek / Vishwanath | New institutional customer registers for the SaaS platform.      |  $\le 15\text{ min}$  |
| [**RB-04**](#rb-04-tenant-decommissioning)          | Tenant Decommissioning & Purge      | Yashwardhan        | School contract termination after 30-day grace period.           |  $\le 30\text{ min}$  |
| [**RB-05**](#rb-05-session-secret-rotation)         | Session Secret Rotation             | Vivek              | Compromise of session encryption key or security audit rotation. |  $\le 10\text{ min}$  |
| [**RB-06**](#rb-06-connection-pool-exhaustion)      | Connection Pool Saturation Recovery | Yashwardhan        | Database rejects connections (`too many clients already`).       |  $\le 10\text{ min}$  |

---

## 2. Summary Procedures

### RB-01: Database Point-in-Time Recovery

1. Identify exact target timestamp prior to corruption event.
2. Spin up target PostgreSQL instance from the most recent healthy nightly snapshot.
3. Apply continuous WAL segments up to target timestamp (`recovery_target_time`).
4. Execute validation suite; update application `DATABASE_URL` and restart container fleet.

### RB-02: Emergency Container Rollback

1. Access container orchestrator / deployment dashboard.
2. Trigger instant rollback to previous container image tag.
3. Verify `/api/v1/health/readiness` returns `200 OK` across all nodes.
4. Notify team in `#engineering-incidents`.

### RB-05: Session Secret Rotation

1. Update `SESSION_SECRET` in environment vault.
2. Trigger rolling restart of application containers.
3. Execute `DELETE FROM sessions WHERE expires_at > NOW();` to force all active clients to re-authenticate with newly signed cookies.
