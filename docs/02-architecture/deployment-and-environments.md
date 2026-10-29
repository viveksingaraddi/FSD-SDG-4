# Deployment and Environments Strategy

This document defines the multi-tier environment strategy, containerization blueprint, secrets management, and cloud hosting topology for the **FSD-SDG-4 Quality Education SaaS** platform.

> **CRITICAL PHASE 0 DIRECTIVE**:  
> This document specifies the target deployment architecture for future phases. **No Dockerfiles, Compose manifests, CI/CD scripts, or cloud resources may be provisioned during Phase 0.**

---

## 1. Multi-Tier Environment Strategy

The platform maintains four strictly isolated operational environments:

| Environment | Purpose | Target Host / Infrastructure | Data Strategy | Access Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Development (`local`)** | Feature development and local debugging. | Local developer machine (Node.js LTS, local Docker PostgreSQL). | Deterministic synthetic mock seed fixtures. | Individual engineer. |
| **Test (`ci`)** | Automated CI pipeline validation. | GitHub Actions runner containers. | Ephemeral PostgreSQL service container, wiped per run. | Automated CI runner. |
| **Staging (`stage`)** | Pre-production testing, integration hardening, accessibility audits. | Cloud container service (e.g., AWS ECS / Render / Fly.io) + Managed Postgres. | Sanitized, anonymized synthetic production-scale dataset. | Internal engineering team & pilot stakeholders. |
| **Production (`prod`)** | Live multi-tenant SaaS application for pilot schools. | Hardened cloud container service + Multi-AZ Managed PostgreSQL + CDN. | Production tenant educational data; continuous WAL backup. | Public TLS endpoints; strict credential controls. |

---

## 2. Container-Ready Architecture Blueprint

The application is designed to be fully container-ready, packageable as lightweight OCI-compliant container images:

```text
[ Client Traffic: HTTPS (443) ]
             │
             ▼
[ Reverse Proxy / Cloud CDN / Edge Load Balancer ]
             │
             ├── Static Routes (/) ─────────► [ Static Asset CDN / Storage ] (React SPA Bundle)
             │
             └── API Routes (/api/v1/*) ────► [ Express App Container ] (Node.js LTS Monolith)
                                                           │
                                                           ▼ (TLS / Port 5432)
                                              [ Managed PostgreSQL Database ]
```

### Containerization Guidelines (for Phase 4+ implementation)
1. **Multi-Stage Builds**: Distinct build and production stages to ensure development dependencies (TypeScript compiler, test runners) are excluded from production images.
2. **Non-Root Execution**: Container processes must execute under a dedicated non-root user (`node` or `appuser`) to mitigate container breakout vulnerabilities.
3. **Healthcheck Probes**: Containers expose `/api/v1/health` and `/api/v1/ready` endpoints reporting process status and database connectivity.

---

## 3. Configuration and Secrets Management

1. **The 12-Factor App Methodology**: All environment-specific parameters are injected strictly via system environment variables.
2. **Schema-Validated Environment Variables**: Backend application boots through a configuration module that parses `process.env` against a strict Zod schema. If required variables (`DATABASE_URL`, `SESSION_SECRET`, `PORT`) are missing or malformed, the process exits immediately with a descriptive fatal error.
3. **Zero Secrets in Source Control**: `.env` files are strictly excluded via `.gitignore`. Production secrets are managed in cloud key-management vaults (e.g., AWS Secrets Manager, Doppler, or GitHub Actions Encrypted Secrets).
