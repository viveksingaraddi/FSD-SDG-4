# Phase 6 Implementation Plan — Backend Foundation, API Contracts & Security Controls

**Phase**: `PHASE 6: Backend Foundation, API Contracts & Security Controls`\
**Status**: `IN PROGRESS`\
**Owner**: Vivek (Tech Lead & Backend Lead)\
**Date**: 2026-11-12

---

## 1. Pre-Execution & Blocking Decision Check

- **Phase 5 Status**: `CONDITIONAL PASS`
  ([`phase-5-final-acceptance-report.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/phase-5-final-acceptance-report.md)).
- **`ADR-0007` (PostgreSQL RLS / `OQ-001`)**: Remains `Proposed` awaiting human
  lead approval. Per Phase 6 governance:
  - Phase 6 **will NOT claim** PostgreSQL RLS is active.
  - Phase 6 implements **application-level tenant scoping** (`TenantContext`,
    `assertTenantContext()`, `createTenantScopedPrisma` extension) paired with
    Phase 5's database-enforced composite `(school_id, id)` foreign keys.
- **Phase Boundary**: Authentication endpoints (`/api/v1/auth/*`), password
  hashing, session issuance, and RBAC route enforcement belong to **Phase 7**
  and are excluded from Phase 6.

---

## 2. Implementation Workstreams

1. **Shared Packages (`@fsd-sdg4/shared-types`, `@fsd-sdg4/validation`,
   `@fsd-sdg4/contracts`)**:
   - Add reusable `uuidSchema`, `sortOrderSchema`, `createSortSchema`,
     `searchQuerySchema`, and `paginatedQuerySchema`.
   - Add `API_ROUTES.V1_HEALTH` (`/api/v1/health`) and `API_ROUTES.OPENAPI`
     (`/api/v1/openapi.json`).
2. **Application Bootstrap & Lifecycle (`apps/api/src/app.ts`, `server.ts`,
   `routes/health.ts`)**:
   - Mount `/api/v1/health` (liveness) alongside `/health` and `/api/v1/ready`
     (PostgreSQL `SELECT 1` readiness probe with latency measurement and zero
     credential exposure).
   - Wire `prisma.$disconnect()` into `SIGTERM`/`SIGINT` graceful shutdown.
3. **Database Access & Tenant Scoping (`apps/api/src/shared/database/`)**:
   - Centralize Prisma singleton + lifecycle helpers (`connectDatabase`,
     `disconnectDatabase`).
   - Implement `createTenantScopedPrisma(prisma, tenantContext)` and
     `assertTenantContext()` for explicit `schoolId` enforcement on
     school-scoped operations.
4. **Validation & Mass-Assignment Protection
   (`apps/api/src/shared/validation/`)**:
   - Implement `validateRequest({ body, params, query })` middleware that strips
     unknown keys and writes parsed payloads to `req.validated` before
     controllers execute.
5. **Security Foundation (`apps/api/src/shared/security/`)**:
   - Configure `helmet`, strict `CORS_ORIGIN` allowlisting, `1mb` body size
     limits, `express-rate-limit` (API-wide + strict sensitive-endpoint
     limiter), and Pino log redaction (`authorization`, `cookie`, `password`,
     `token`, `secret`).
6. **Logging, Error Management & OpenAPI (`apps/api/src/shared/errors/`,
   `logging/`, `http/`, `docs/`)**:
   - Typed error classes (`BadRequestError`, `ForbiddenError`, `NotFoundError`,
     `ConflictError`, `ValidationError`, `RateLimitError`) + Prisma
     `P2002`/`P2003`/`P2025` error mapping into RFC 7807 JSON.
   - Standard `sendSuccess` / `sendPaginated` response envelope helpers.
   - OpenAPI 3.1 JSON document served at `GET /api/v1/openapi.json`.
7. **Automated Verification**:
   - Unit tests for validation middleware, error mapping, tenant scoping
     helpers, and pagination helpers.
   - Supertest integration tests for `/api/v1/health`, `/api/v1/ready`,
     `/api/v1/openapi.json`, security headers, CORS rejection, rate limiting,
     Zod 422 validation errors, mass-assignment stripping, and 404/500 RFC 7807
     envelopes.
