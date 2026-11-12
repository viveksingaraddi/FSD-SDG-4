# ADR-0007: PostgreSQL Row-Level Security (RLS) Evaluation (Resolves OQ-001)

- **Status**: Proposed (Awaiting Human Lead Approval)
- **Date**: 2026-11-12
- **Deciders**: Yashwardhan (Database Lead), Vivek (Tech Lead), Vishwas (QA/Security Lead)
- **Resolves**: `OQ-001` (PostgreSQL Row-Level Security activation vs. application-layer isolation)

---

## 1. Context and Problem Statement

FSD-SDG-4 uses a **Shared Database, Shared Schema** multi-tenancy model in PostgreSQL 16 (`16.15`) with Prisma ORM (`6.19.3`). All 25 tenant-owned models reside in the `public` schema partitioned by `school_id`. We must decide whether to:

- **Option A**: Enforce tenant isolation via **Database-Enforced Composite Tenant Foreign Keys (`(school_id, parent_id) REFERENCES parent(school_id, id)`), PostgreSQL `CHECK` constraints, and Application-Layer Prisma Client Extension scoping** (planned for Phase 6–7), while deferring PostgreSQL Row-Level Security (RLS) to Phase 15 hardening.
- **Option B**: Enable **PostgreSQL Native Row-Level Security (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`)** on all tenant tables immediately in Phase 5, requiring `SET LOCAL app.current_school_id` inside every pooled transaction.

---

## 2. Comparative Evaluation

| Dimension                            | Option A: Composite Tenant FKs + Prisma Extension                                                               | Option B: Option A + Mandatory PostgreSQL RLS                                                                                                                     |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Defense in Depth**                 | Strong referential & cross-tenant FK protection at DB level; relies on Prisma extension for `SELECT` filtering. | Kernel-level row filtering even on raw SQL omissions.                                                                                                             |
| **Prisma Integration**               | Zero friction with standard `prisma.model.findMany()`, `create()`, and `migrate`.                               | Requires wrapping **every** query in `prisma.$transaction(async (tx) => { await tx.$executeRaw\`SELECT set_config('app.current_school_id', ..., true)\`; ... })`. |
| **PgBouncer Transaction Pooling**    | Zero session-state risk; connections are stateless between queries.                                             | Safe **only** if `SET LOCAL` (transaction-scoped) is used inside explicit transactions; session-level `SET` leaks tenant state across pooled connections.         |
| **Background Jobs & Super Admin**    | Explicit `bypassTenantScope` helper or direct admin client on `/api/v1/admin/*`.                                | Requires separate non-RLS DB role or explicit `app.bypass_rls = 'on'` setting inside transactions.                                                                |
| **Migration & Seed Behavior**        | Standard `prisma migrate deploy` and `prisma db seed` work cleanly.                                             | Requires separate migration owner role (with `BYPASSRLS`) distinct from runtime app role (`NOBYPASSRLS`).                                                         |
| **Testing & Operational Complexity** | Low operational risk; fast unit/integration tests.                                                              | High transaction-wrapping overhead on read-heavy endpoints; complicates connection pool tuning.                                                                   |

---

## 3. Decision (Proposed)

**Select Option A as the Phase 5–14 baseline, with Option B (RLS) explicitly deferred to the Phase 15 Security & Load-Testing Gate.**

Specifically:

1. **Cross-Tenant Referential Integrity (Active Now in Phase 5)**: Every tenant-owned parent model exposes `@@unique([schoolId, id])`, and every child foreign key uses composite `(school_id, parent_id)` references. PostgreSQL rejects any cross-school reference at the storage engine level (`SQLSTATE 23503`).
2. **Role/Tenant Boundary `CHECK` Constraint (Active Now in Phase 5)**: `users` enforces `(role = 'SUPER_ADMIN' AND school_id IS NULL) OR (role <> 'SUPER_ADMIN' AND school_id IS NOT NULL)`.
3. **Query-Layer Isolation (Phase 6–7)**: A Prisma Client extension automatically injects `schoolId` from verified `SessionContext` into all tenant-scoped reads and writes, backed by mandatory cross-tenant API tests.
4. **Phase 15 RLS Gate**: Before production launch, Vishwas & Yashwardhan will benchmark `SET LOCAL` + PgBouncer transaction pooling latency in staging. If activated, the runtime app role must use `NOBYPASSRLS` and **never** use session-level `SET`.

---

## 4. Safe Context-Setting Strategy (If Option B Is Activated in Phase 15)

If RLS is enabled in Phase 15:

- Provision two PostgreSQL roles: `fsd_migrator` (schema owner, `BYPASSRLS` for migrations only) and `fsd_app` (`NOSUPERUSER NOBYPASSRLS` for API runtime).
- Wrap every tenant-scoped request transaction with `SELECT set_config('app.current_school_id', $1, true)` (`is_local = true`), which automatically resets on `COMMIT` or `ROLLBACK` — preventing tenant context leakage across PgBouncer pooled connections.
- Policies use `school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid` (fail-closed: returns 0 rows if unset).

---

## 5. Limitation & Blocking Human Approval Question

- **Explicit Limitation**: Composite `(school_id, id)` foreign keys protect **referential integrity** (blocking cross-school writes and foreign-key links at the PostgreSQL layer), **not** un-scoped `SELECT` queries. Complete read/write tenant isolation requires **Phase 6–7 Prisma Client extension query scoping + route guards** (under Option A) or **PostgreSQL RLS** (under Option B).
- **Blocking Human Decision**: Database Lead (**Yashwardhan**), Tech Lead (**Vivek**), and QA/Security Lead (**Vishwas**) must formally approve whether to:
  1. **Accept Option A** as the Phase 5–14 baseline and defer RLS activation to Phase 15 (Recommended), **or**
  2. **Require Option B (PostgreSQL RLS)** before Phase 6–7 backend feature development begins.
