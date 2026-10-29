# Architectural and Product Decision Log

This log chronicles all major technical, architectural, and product decisions reached during the lifecycle of the **FSD-SDG-4 Quality Education SaaS** project.

---

## Decision Log Catalog

| Decision ID | Date | Topic | Selected Decision | Status | Deciders | ADR Reference |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| **DEC-001** | 2026-10-29 | Backend Architecture Pattern | Adopt **Modular Monolith** in Node.js instead of microservices. | **Proposed** | Vivek, Vishwanath, Yashwardhan, Vishwas | [ADR-0001](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0001-modular-monolith.md) |
| **DEC-002** | 2026-10-29 | Core Technology Stack | Adopt React 18+, Vite, Tailwind CSS, Express, PostgreSQL 16+, Prisma ORM. | **Proposed** | All Leads | [ADR-0002](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0002-technology-stack.md) |
| **DEC-003** | 2026-10-29 | Multi-Tenancy Architecture | Adopt **Shared Database, Shared Schema** with `school_id` foreign keys and Prisma middleware isolation. | **Proposed** | Vivek, Yashwardhan, Vishwas | [ADR-0003](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0003-multi-tenancy-strategy.md) |
| **DEC-004** | 2026-10-29 | Authentication & Sessions | Adopt **Server-Managed Database Sessions**, `HttpOnly` secure cookies, and **Argon2id** password hashing. | **Proposed** | Vivek, Vishwas | [ADR-0004](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0004-authentication-and-sessions.md) |
| **DEC-005** | 2026-10-29 | API Contracts & Errors | Adopt REST `/api/v1` with **Zod** validation, **RFC 7807** Problem Details error format, and OpenAPI 3.1. | **Proposed** | Vivek, Vishwanath | [ADR-0005](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0005-api-contracts.md) |
| **DEC-006** | 2026-10-29 | Testing Strategy | Adopt **Vitest**, Supertest, React Testing Library, and Playwright with mandatory tenant isolation test suite. | **Proposed** | Vishwas, Vivek | [ADR-0006](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/ADR-0006-testing-and-quality.md) |
| **DEC-007** | 2026-10-29 | Closed Loop Pedagogy | Establish the core 5-stage loop: $\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$. | **Accepted** | Vishwanath, Vivek | [Charter](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/00-project-governance/project-charter.md) |
| **DEC-008** | 2026-10-29 | Ethical Flagging Principle | Prohibit autonomous diagnostic labels; enforce transparent human-in-the-loop review for all support flags. | **Accepted** | All Leads | [Product Overview](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/product-overview.md) |
| **DEC-009** | 2026-10-29 | Zero Real PII Mandate | Prohibit real student or teacher personal information in non-production environments and test fixtures. | **Accepted** | All Leads | [Data Privacy](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/data-privacy-and-retention.md) |
| **DEC-010** | 2026-10-29 | Accessibility Standard | Mandate **WCAG 2.2 Level AA** conformance across all views with automated `axe-core` CI scans. | **Accepted** | Vishwanath, Vishwas | [A11y Strategy](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/accessibility-and-inclusion.md) |
| **DEC-011** | 2026-10-29 | Parent Portal Prioritization| Classify Parent/Guardian portal as **Priority P1** for implementation in Phase 14. | **Proposed** | Vishwanath, Vivek | [Scope](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/00-project-governance/scope-and-non-goals.md) |
