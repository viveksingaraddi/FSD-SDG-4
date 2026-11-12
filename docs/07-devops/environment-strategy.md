# Environment Management and Promotion Strategy

This document defines the configuration, network boundaries, dataset policies, and promotion lifecycle across the four operational tiers of the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Operational Environment Tiers

```text
[ Local Developer Machine ] ──► PR ──► [ CI Test Runner (Ephemeral) ]
                                                   │
                                                   ▼ Merge to Phase Branch
                                        [ Staging Cloud Tier ]
                                                   │
                                                   ▼ Phase Gate Sign-off
                                       [ Production Cloud Tier ]
```

| Dimension       | 1. Local Development           | 2. Continuous Integration (CI) | 3. Staging (`stage`)                  | 4. Production (`prod`)             |
| :-------------- | :----------------------------- | :----------------------------- | :------------------------------------ | :--------------------------------- |
| **Hosting**     | Local Host (Node.js LTS)       | GitHub Actions Runner          | Cloud Container Service               | Multi-AZ Cloud Container Service   |
| **Base URL**    | `http://localhost:5173`        | Ephemeral `localhost`          | `https://stage.fsd-sdg4.internal`     | `https://app.fsd-sdg4.internal`    |
| **API URL**     | `http://localhost:3001/api/v1` | Ephemeral `localhost:3001`     | `https://stage-api.fsd-sdg4.internal` | `https://api.fsd-sdg4.internal`    |
| **Database**    | Docker PostgreSQL (Port 5432)  | Ephemeral Service Container    | Managed PostgreSQL (Single AZ)        | Managed PostgreSQL (Multi-AZ HA)   |
| **Data Policy** | Synthetic seed dataset         | Ephemeral mock fixtures        | Anonymized synthetic scale data       | Real institutional student data    |
| **Secrets**     | Local `.env` (gitignored)      | GitHub Encrypted Secrets       | Cloud Secrets Manager (Stage)         | Cloud Secrets Manager (Prod)       |
| **Logging**     | Human-readable `pino-pretty`   | Structured JSON                | Structured JSON (30-day retention)    | Structured JSON (90-day retention) |

> **Phase 4 Environment Templates**: Placeholder-only templates are tracked in `apps/api/.env.example`, `apps/api/.env.test.example`, and `apps/web/.env.example`. `apps/api/src/config/env.ts` validates backend variables via Zod at boot time and rejects invalid configurations. See [`docs/07-devops/local-development-guide.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/07-devops/local-development-guide.md) for local setup.

---

## 2. Environment Promotion Path

1. **Promotion to CI**: Automatically triggered upon opening a pull request or pushing to a branch.
2. **Promotion to Staging**: Automatically triggered upon merging an approved PR into the active `phase/*` integration branch. Used by the team for accessibility audits, load testing, and stakeholder reviews.
3. **Promotion to Production**: Gated by formal release acceptance sign-off. Requires explicit manual approval from Tech Lead Vivek and Product Lead Vishwanath in the release workflow.
