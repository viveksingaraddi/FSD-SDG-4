# Definition of Ready and Definition of Done

To ensure consistent quality, security, and traceability across the 16 delivery phases, the FSD-SDG-4 project establishes rigorous criteria for the **Definition of Ready (DoR)** and **Definition of Done (DoD)**.

---

## 1. Definition of Ready (DoR)

A user story, feature, or phase milestone is considered **Ready** for implementation only when it satisfies all of the following preconditions:

1. **Clear Business Objective**: The user story clearly articulates _Who_ (persona), _What_ (capability), and _Why_ (educational or operational benefit).
2. **Unambiguous Acceptance Criteria**: Acceptance criteria are written in testable Gherkin format (`Given / When / Then`) covering happy paths, edge cases, and permission violations.
3. **Data & Schema Dependencies Mapped**: Any required database entity, relational foreign key, or constraint changes are documented in the data dictionary and approved by Yashwardhan.
4. **API Contract Specified**: For backend work, the REST endpoint route, HTTP method, request parameters, Zod validation schema, and success/error response structures are documented in OpenAPI format.
5. **UI/UX Wireframe & State Mapping**: For frontend work, desktop and mobile responsive views, empty states, loading states, error states, and keyboard navigation tab stops are documented.
6. **Multi-Tenancy & Authorization Rules Stated**: Tenant boundary verification (`school_id`) and role requirements (RBAC) are explicitly documented.
7. **Traceability Established**: The story is linked to a valid Requirement ID (`FR-*` or `NFR-*`) in the Requirements Traceability Matrix.

---

## 2. Definition of Done (DoD)

A user story or feature is considered **Done** and eligible for inclusion in the release candidate only when all of the following requirements are fulfilled and verified:

### 2.1 Code Quality & TypeScript

- Code compiles under strict TypeScript (`"strict": true`) with zero compiler warnings and zero `any` annotations.
- Code conforms to ESLint rules and Prettier formatting conventions without unapproved lint-disables.
- Modular monolith boundaries are preserved (no circular module imports, no direct cross-module database mutations).

### 2.2 Security & Tenant Isolation

- Zero-trust multi-tenancy enforced: every database query touching school data filters by `school_id` derived exclusively from the authenticated session context.
- Input validation: All inbound request bodies and parameters validated via Zod schemas before reaching business logic.
- No secrets, API keys, or real student PII present in code, logs, comments, or test fixtures.
- Sensitive state-changing operations recorded in the immutable audit log.

### 2.3 Automated Testing

- Unit tests written with Vitest achieving $\ge 85\%$ line coverage for domain services and business logic.
- API integration tests written with Supertest verifying status codes, RFC 7807 error formats, and RBAC rejection (401/403).
- Dedicated tenant isolation test executed verifying that User A from School 1 cannot read, edit, or delete School 2 records (404/403).
- E2E tests written with Playwright covering the primary user journey.

### 2.4 Accessibility (WCAG 2.2 AA)

- Semantic HTML tags utilized (`<nav>`, `<main>`, `<article>`, `<button>`, `<fieldset>`).
- Automated `axe-core` accessibility scans report zero Level A and Level AA violations.
- Interactive elements are fully operable via keyboard with visible focus rings and accessible ARIA names.

### 2.5 Documentation & Review

- Related documentation in `docs/` (API catalog, entity dictionaries, user guides) updated in the same PR.
- Code reviewed and approved by at least one designated domain lead (Vishwanath, Vivek, Yashwardhan, Vishwas).
- CI/CD pipeline passes all build, test, lint, and security checks.
