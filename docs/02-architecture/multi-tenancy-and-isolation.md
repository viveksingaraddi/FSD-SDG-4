# Multi-Tenancy and Isolation Architecture

This document defines the multi-tenant architecture, isolation mechanisms, defense-in-depth layers, and operational trade-offs for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Tenancy Model: Shared Database, Shared Schema

The platform adopts a **Shared Database, Shared Schema** multi-tenancy model:

- All school tenants reside within a single PostgreSQL database instance under the standard `public` schema.
- Every tenant-owned database table includes a non-nullable foreign key column: `school_id UUID REFERENCES schools(id) ON DELETE CASCADE`.
- Tenant separation is enforced logically through rigorous application-layer query partitioning, composite database constraints, and evaluated database-level Row-Level Security (RLS).

### Architectural Rationale

- **Resource Efficiency**: A small engineering team can manage, migrate, and backup a single database cluster far more reliably than managing 50+ separate database instances or schemas.
- **Unified Migrations**: Schema migrations execute once per release across the entire database, eliminating migration drift across tenants.
- **Connection Efficiency**: Avoids connection pool starvation that occurs when maintaining separate connection pools for dozens of distinct database schemas.

---

## 2. Defense-in-Depth Multi-Tenancy Architecture

Tenant isolation is never entrusted to a single manual `WHERE` clause. It is enforced across four independent defense rings:

```mermaid
flowchart TD
    Req[Incoming HTTP Request] --> R1[Ring 1: Session Cryptographic Validation<br>Extract verified schoolId from signed session cookie]
    R1 --> R2[Ring 2: Route Authorization Guard<br>Assert session.schoolId matches requested resource tenant]
    R2 --> R3[Ring 3: Prisma Query Extension<br>Automatically injects { schoolId } into all SELECT, UPDATE, DELETE queries]
    R3 --> R4[Ring 4: Relational Composite Constraints<br>UNIQUE(school_id, student_id_number), UNIQUE(school_id, class_name)]
    R4 --> DB[(PostgreSQL Database)]
```

### Ring 1: Session Cryptographic Validation

- The authenticated `SessionContext` is derived solely from the server-managed session in PostgreSQL, which is mapped to a secure `HttpOnly` cookie.
- The client cannot spoof or override `schoolId` by passing a custom header or JSON payload attribute.

### Ring 2: Route & Controller Authorization

- API endpoints verify that any tenant ID passed in route parameters matches the caller's session `schoolId`:
  ```typescript
  if (
    req.params.schoolId &&
    req.params.schoolId !== req.sessionContext.schoolId &&
    req.sessionContext.role !== 'SUPER_ADMIN'
  ) {
    throw new ForbiddenError('Cross-tenant access prohibited.');
  }
  ```

### Ring 3: Data-Access Layer Enforcement (Prisma Extension)

- A Prisma Client extension intercepts all model queries for tenant-owned models and automatically injects `{ schoolId }` into the `where` criteria:
  ```typescript
  prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, schoolId: currentSession.schoolId };
          return query(args);
        },
      },
    },
  });
  ```
- This prevents developer omission errors where a developer forgets to manually append `where: { schoolId }`.

### Ring 4: Relational Composite Constraints

- Database constraints enforce tenant scoping natively. Natural keys are always paired with `school_id`:
  - `UNIQUE (school_id, student_id_number)`
  - `UNIQUE (school_id, academic_year_name)`
  - `UNIQUE (school_id, class_section_id, attendance_date, student_id)`

---

## 3. Evaluation of PostgreSQL Row-Level Security (RLS)

PostgreSQL Row-Level Security (RLS) provides kernel-level defense: even if an application SQL query omits the tenant filter, PostgreSQL blocks rows where `school_id != CURRENT_SETTING('app.current_school_id')`.

### Operational Trade-off Analysis

| Dimension                          | Application-Layer Isolation (Prisma)                                                | PostgreSQL Native RLS                                                                                         |
| :--------------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Strengths**                      | Fast, simple debugging; standard Prisma tooling; no connection session state leaks. | Kernel-level guarantee; immune to application code bugs or raw SQL omissions.                                 |
| **Operational Overhead**           | Developer discipline and automated tests required.                                  | Requires setting session variables (`SET LOCAL app.current_school_id = ...`) inside every pooled transaction. |
| **Connection Pooling (PgBouncer)** | Zero friction in transaction pooling mode.                                          | Can cause tenant state leakage if `SET LOCAL` is omitted or if connection is returned to pool uncleanly.      |
| **Recommendation**                 | **Primary baseline for Phase 6–7**.                                                 | **Evaluated in Phase 5 staging spike** for optional defense-in-depth activation.                              |

---

## 4. Separation of Super Admin vs. School Operations

Platform Super Admins manage global tenant lifecycle (create school, suspend subscription) via a dedicated `/api/v1/admin/*` route hierarchy.

**Architectural Invariant**: Super Admin endpoints are completely decoupled from school-level educational endpoints. Super Admins do not possess a default `schoolId` and are blocked from querying student grades or support plans without explicit institutional audit elevation.
