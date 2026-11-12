# Data Architecture Specification

This document establishes the data architecture, data modeling philosophy, relational principles, and lifecycle governance for the **FSD-SDG-4 Quality Education SaaS** platform.

> **Phase 5 Status**:  
> The physical PostgreSQL `16.15` schema (`26` models, `14` enums) is implemented in [`apps/api/prisma/schema.prisma`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/schema.prisma) and [`apps/api/prisma/migrations/20261112065114_init/migration.sql`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/migrations/20261112065114_init/migration.sql) using Prisma `6.19.3`. See [`physical-schema-documentation.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/03-data/physical-schema-documentation.md).

---

## 1. Data Modeling Tiers

The data architecture is structured across three distinct abstraction tiers:

```text
[ Conceptual Data Model ]   ──► High-level educational domain entities & business relationships.
         │
         ▼
[ Logical Relational Model ] ──► Normalized relational tables, foreign keys, cardinality, tenant scoping.
         │
         ▼
[ Physical PostgreSQL Schema ] ──► (Phase 5) PostgreSQL DDL, data types (UUID, TIMESTAMPTZ), B-tree indexes, constraints.
```

1. **Conceptual Data Model**: Captures real-world educational entities (Schools, Academic Years, Classes, Sections, Students, Attendance, Support Plans) independent of physical database technology.
2. **Logical Relational Model**: Defines table structures normalized to Third Normal Form (3NF), explicit primary keys (UUID v4 or v7), foreign keys, composite uniqueness constraints, and tenant boundary mappings (`school_id`).
3. **Physical PostgreSQL Schema**: Specifies physical column types (`UUID`, `VARCHAR`, `TIMESTAMPTZ`, `DECIMAL`), database-level constraints (`CHECK`, `FOREIGN KEY ON DELETE`), composite B-Tree indexes, and Prisma ORM mappings.

---

## 2. Core Relational Principles

1. **Strict Multi-Tenant Scoping**: Every tenant-owned table must include a non-nullable foreign key `school_id REFERENCES schools(id) ON DELETE CASCADE`.
2. **Surrogate Keys with Business Natural Uniqueness**: Entities use immutable UUID surrogate primary keys for stable relational integrity, paired with composite natural unique keys (e.g., `UNIQUE(school_id, student_id_number)`).
3. **Auditability and Timestamp Tracking**: Every entity includes `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`. Entities with soft-deletion support include an indexed `deleted_at TIMESTAMPTZ NULL`.
4. **Third Normal Form (3NF) Baseline**: Tables are normalized to 3NF to prevent update anomalies. Pre-aggregated performance snapshots (e.g., longitudinal student progress averages) are computed asynchronously or maintained as dedicated materialized cache tables with strict invalidation rules.
5. **ACID Transaction Boundaries**: Multi-table state mutations (e.g. submitting section attendance, or confirming a support flag and creating a linked support plan) execute within explicit database transactions.
