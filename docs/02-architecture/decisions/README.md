# Architecture Decision Records (ADRs)

This directory contains the formal Architecture Decision Records (ADRs) for the **FSD-SDG-4 Quality Education SaaS** platform. ADRs document significant architectural, technical, and structural choices, recording the context, options considered, trade-offs, and security/operational implications.

---

## Decision Status Lifecycle

- **Proposed**: Under review by engineering leadership (Vishwanath, Vivek, Yashwardhan, Vishwas). Default status for all Phase 0 architectural records.
- **Accepted**: Ratified by the designated domain leads and approved for active implementation.
- **Rejected**: Evaluated and discarded with documented rationale.
- **Superseded**: Replaced by a subsequent approved ADR (with cross-reference).

---

## Active Architecture Decision Records Index

| ADR ID                                                                                                                                     | Title                                |    Status    | Primary Decision                                                                                           | Date       |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- | :----------: | :--------------------------------------------------------------------------------------------------------- | :--------- |
| [**ADR-0001**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0001-modular-monolith.md)            | Modular Monolith Architecture        | **Proposed** | Adopt a single deployable Express monolith partitioned into domain modules instead of microservices.       | 2026-10-29 |
| [**ADR-0002**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0002-technology-stack.md)            | Core Technology Stack Selection      | **Proposed** | Adopt React+Vite+Tailwind on client, Node+Express on backend, PostgreSQL+Prisma on data layer.             | 2026-10-29 |
| [**ADR-0003**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0003-multi-tenancy-strategy.md)      | Multi-Tenancy Isolation Strategy     | **Proposed** | Adopt shared database and shared schema partitioned by `school_id` with application-layer enforcement.     | 2026-10-29 |
| [**ADR-0004**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0004-authentication-and-sessions.md) | Authentication & Session Management  | **Proposed** | Adopt server-managed database sessions, `HttpOnly` cookies, and Argon2id password hashing.                 | 2026-10-29 |
| [**ADR-0005**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0005-api-contracts.md)               | REST API Contracts & Validation      | **Proposed** | Adopt REST `/api/v1` with Zod runtime validation, RFC 7807 error envelopes, and OpenAPI 3.1 contracts.     | 2026-10-29 |
| [**ADR-0006**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0006-testing-and-quality.md)         | Testing & Quality Assurance Strategy | **Proposed** | Adopt Vitest, Supertest, React Testing Library, and Playwright with mandatory tenant isolation test suite. | 2026-10-29 |
