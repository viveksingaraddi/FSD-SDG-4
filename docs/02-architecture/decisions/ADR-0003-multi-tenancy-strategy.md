# ADR-0003: Multi-Tenancy Architecture and Isolation Strategy

- **Status**: Proposed
- **Date**: 2026-10-29
- **Deciders**: Vivek (Tech Lead), Yashwardhan (Database Lead), Vishwas (QA Lead)

---

## 1. Context and Problem Statement

The platform must serve multiple independent school tenants while maintaining strict data confidentiality, preventing cross-tenant information leakage, and complying with student privacy regulations. We must determine the optimal tenancy model (database-per-tenant, schema-per-tenant, or shared-database/shared-schema) and the isolation enforcement mechanism.

---

## 2. Decision

We will implement a **Shared Database, Shared Schema** tenancy architecture:
1. Every tenant-owned table includes a mandatory foreign key `school_id UUID REFERENCES schools(id) ON DELETE CASCADE`.
2. Tenant isolation is enforced primarily at the application data-access layer via a custom Prisma Client extension that automatically scopes all queries (`findMany`, `findFirst`, `update`, `delete`) to the session's verified `schoolId`.
3. Unique natural constraints are composite, incorporating `school_id` (e.g., `UNIQUE(school_id, student_id_number)`).
4. Platform Super Admin operations are isolated to dedicated `/api/v1/admin/*` endpoints without default tenant bypass on educational routes.
5. PostgreSQL Row-Level Security (RLS) is earmarked for staging evaluation in Phase 5 as an auxiliary defense-in-depth layer.

---

## 3. Alternatives Considered

### Alternative A: Database-per-Tenant
- *Description*: Provisioning a distinct PostgreSQL database for each registered school.
- *Rejection Rationale*: Massive infrastructure cost and operational overhead for 50+ schools. Schema migrations would need to be orchestrated sequentially across dozens of databases. Connection pooling becomes fragmented and unmanageable.

### Alternative B: Schema-per-Tenant
- *Description*: A single PostgreSQL instance with separate schemas (`school_01`, `school_02`) per tenant.
- *Rejection Rationale*: Prisma ORM does not natively support dynamic runtime multi-schema routing without complex connection switching or raw SQL. Migration execution time scales linearly with tenant count.

---

## 4. Benefits

- **Operational Efficiency**: Single database backup, single migration runner, unified connection pool.
- **Cost Effective**: Highly economical hosting footprint for initial SaaS pilot deployments.
- **Consistent Schema State**: All tenants are always on the identical database migration version.

---

## 5. Trade-offs and Consequences

- **Risk of Developer Omission**: If a developer bypasses Prisma extensions or writes raw SQL without a `school_id` filter, data could leak across tenants.
  - *Mitigation*: Mandatory automated tenant isolation test suite in CI testing every endpoint with cross-tenant tokens; composite database constraints; evaluation of native RLS in Phase 5.

---

## 6. Conditions for Revisit

This decision will be revisited if:
1. Large enterprise school districts require dedicated data residency or dedicated encryption keys per tenant.
2. A single tenant's transaction volume exceeds 60% of database capacity, necessitating physical sharding.
