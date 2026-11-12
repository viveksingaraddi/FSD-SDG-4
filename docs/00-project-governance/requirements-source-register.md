# Requirements Source Register

This register catalogues the authoritative sources used to establish the project baseline for the **FSD-SDG-4 Quality Education SaaS** platform. It explicitly documents the origin of requirements, distinguishes source-confirmed decisions from recommendations, and details known gaps and contradictions.

---

## 1. Workspace Source Audit & Limitation Statement

> **FORMAL AUDIT NOTE**:  
> Prior to compiling this blueprint, a full recursive filesystem inspection of the workspace root (`/Users/viveksantoshkumarsingaraddi/FSD-SDG-4`) was conducted on 2026-10-29.  
> **Finding**: The workspace was initialized as an empty Git repository containing only the `.git` directory. No prior external specification documents, presentation decks (`.pdf`, `.pptx`), or legacy codebase files were present in the local filesystem.  
> **Implication**: In accordance with Phase 0 governance rules ("If source files are unavailable, explicitly document that limitation. Do not pretend to have reviewed files you cannot access."), the authoritative primary source for this architecture is the comprehensive Phase 0 Architectural Prompt and Project Specification Mandate (`SRC-PROMPT-001`). External references are noted as target documents for team review during Phase 1.

---

## 2. Requirements Source Register Catalog

| Source Identifier  | Source Name                                           | Source Type            | Key Topics Covered                                                                                                                                                                                                                                                                            | Decisions Supported                                                                                                                                                                                                                     | Known Gaps / Contradictions                                         | Status / Location            |
| :----------------- | :---------------------------------------------------- | :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :--------------------------- |
| **SRC-PROMPT-001** | Phase 0 Engineering Architecture & Governance Mandate | Prompt Specification   | - System boundaries and non-goals<br>- 5 primary personas<br>- Core closed loop: Record $\to$ Understand $\to$ Flag $\to$ Support $\to$ Review<br>- Mandatory tech stack (React, Express, Postgres, Prisma)<br>- Shared DB / Shared schema multi-tenancy<br>- 16-phase implementation roadmap | - Modular monolith pattern (ADR-0001)<br>- React/Express/PostgreSQL stack (ADR-0002)<br>- Shared-schema tenancy (ADR-0003)<br>- Server-managed sessions (ADR-0004)<br>- REST `/api/v1` (ADR-0005)<br>- WCAG 2.2 AA accessibility target | None internal; establishes authoritative baseline for Phase 0.      | Active in prompt context.    |
| **SRC-UN-SDG4**    | United Nations SDG-4 Quality Education Framework      | International Standard | - Equitable, inclusive access to primary & secondary education<br>- Non-punitive intervention<br>- Safe, accessible learning environments                                                                                                                                                     | - Non-punitive, explainable support flags<br>- Accessible, low-bandwidth UI design<br>- Zero real PII in test environments                                                                                                              | General policy document; does not specify software data structures. | Public UN metadata standard. |
| **SRC-WCAG-2.2**   | W3C Web Content Accessibility Guidelines 2.2          | Technical Standard     | - Keyboard accessibility<br>- Contrast ratios ($\ge 4.5:1$ text)<br>- Focus visible<br>- Target size ($\ge 24\times 24$ CSS px)                                                                                                                                                               | - Design system headless primitives<br>- Semantic HTML mandates<br>- Keyboard navigation testing in CI                                                                                                                                  | Requires implementation-level verification in Phase 3 & 15.         | W3C Recommendation.          |
| **SRC-RFC-7807**   | RFC 7807 / RFC 9457 Problem Details for HTTP APIs     | Technical Standard     | - Standardized JSON error response structures for REST APIs                                                                                                                                                                                                                                   | - API error response format across all `/api/v1` endpoints (ADR-0005)                                                                                                                                                                   | Does not prescribe multi-tenant authorization error details.        | IETF Internet Standard.      |

---

## 3. Confirmed Requirements vs. Recommendations vs. Unresolved Decisions

### 3.1 Source-Confirmed Requirements (Approved Baseline)

1. **Multi-Tenancy Model**: Logical isolation per school via `school_id` partitioning in a shared PostgreSQL database and shared schema.
2. **Identity & Authentication**: Server-managed sessions with cryptographically random session IDs, `HttpOnly`/`Secure`/`SameSite` cookies, and Argon2id password hashing.
3. **Core Educational Loop**: System must implement the sequence $\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$.
4. **Human-in-the-Loop Flags**: Support flags must never automatically diagnose or penalize students without human teacher/counselor review.
5. **Technology Stack**: React, Vite, Tailwind CSS, TypeScript, Express, PostgreSQL, Prisma ORM, Vitest, Playwright.
6. **Accessibility**: Target WCAG 2.2 Level AA compliance across all user-facing views.

### 3.2 Architectural Recommendations (Subject to Phase 1-5 Validation)

1. **PostgreSQL Row-Level Security (RLS)**: Recommended as an added defense-in-depth layer behind application-layer Prisma middleware, pending connection pooling performance evaluation in Phase 5.
2. **Offline Attendance Syncing**: Client-side IndexedDB caching recommended for rural intermittent connectivity, targeted for detailed UX design in Phase 2.
3. **P1 Scope Timing**: Parent/Guardian portal mapped as P1 for Phase 14, while ensuring database models preserve foreign-key relationships for future guardian accounts.

### 3.3 Unresolved Decisions and Recorded Conflicts

- **Conflict C-001**: _Strict RLS vs. Connection Pool Scalability_: Enabling RLS with `SET LOCAL app.current_tenant_id` inside pooled transactions requires careful session management in Prisma/PgBouncer.  
  _Proposed Resolution_: Implement strict application-layer filtering in Phase 6-7 services with automated multi-tenant test suites; evaluate RLS as an auxiliary migration in Phase 5.
- **Conflict C-002**: _Parent Involvement in Early Support Flags_: Does a teacher's preliminary draft support flag become visible to parents immediately, or only after the Support Plan is formally approved by school administration?  
  _Proposed Resolution_: Keep support flags in a "Draft / Under Review" status visible only to staff; release to parents only when the plan is designated "Active" by the school admin. Recorded for Phase 1 stakeholder sign-off.
