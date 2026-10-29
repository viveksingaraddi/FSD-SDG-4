# AGENTS.md — Persistent Instructions for AI Coding Agents

> **CRITICAL OPERATING DIRECTIVE: PHASE 0 IS CURRENTLY ACTIVE**  
> Under NO circumstances is any AI agent authorized to write application code, initialize frameworks, create package manifests, generate database schemas, or run dev servers in this project until Phase 0 has been formally concluded and a subsequent implementation phase is explicitly authorized by the user.

---

## 1. Prime Directives for All Future Agents

When interacting with this repository in any phase, every AI agent must strictly adhere to the following fifteen rules:

1. **Read Project Documentation Before Touching Code**:  
   Before creating or modifying any file, inspect the relevant architectural guidelines in [`docs/02-architecture/`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/architecture-overview.md), data specifications in [`docs/03-data/`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/03-data/data-architecture.md), and API standards in [`docs/04-api/`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/04-api/api-design-standards.md).

2. **Strictly Respect Phase Boundaries**:  
   Work ONLY within the tasks authorized for the current phase as recorded in [PROJECT_STATUS.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/PROJECT_STATUS.md). NEVER begin or leap ahead into future phases without an explicit, approved prompt from the user.

3. **Never Skip Acceptance Criteria**:  
   Every feature, endpoint, or component must fulfill all functional and non-functional acceptance criteria defined in [docs/08-delivery/phase-acceptance-matrix.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/phase-acceptance-matrix.md) and the corresponding requirements specification.

4. **Preserve Architectural Decisions (ADRs)**:  
   Never silently alter, bypass, or overturn approved decisions in [`docs/02-architecture/decisions/`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/decisions/README.md). If a change in technology or approach is warranted, document the rationale in a new Proposed ADR and await human review.

5. **Never Scope Creep**:  
   Do not implement unsolicited features, speculative abstractions, or out-of-scope utilities. Adhere strictly to the bounded scope in [docs/00-project-governance/scope-and-non-goals.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/00-project-governance/scope-and-non-goals.md).

6. **Enforce Tenant Isolation Everywhere (Zero Trust)**:  
   Every backend route, service, and database query interacting with tenant-owned data MUST explicitly validate and enforce `school_id` from the authenticated session context. Never trust client-supplied `school_id` parameters in request bodies or query strings without cryptographic session validation.

7. **Strict TypeScript Without Exception**:  
   When code writing is authorized, enforce TypeScript in strict mode. Use of `any`, untyped catches, or ignoring type errors via `@ts-ignore` without documented justification is strictly forbidden.

8. **Zero PII & Synthetic Test Data Only**:  
   Never place real student, teacher, or parent Personally Identifiable Information (PII) into fixtures, seed scripts, logs, or test suites. All automated tests must use synthetic data conforming to privacy guidelines in [docs/01-product/data-privacy-and-retention.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/data-privacy-and-retention.md).

9. **No Secrets in Source Control**:  
   Never hardcode credentials, session secrets, API tokens, or encryption keys in source files or documentation. All secrets must be loaded via environment variables validated at boot time.

10. **Write Tests Concurrently with Implementation**:  
    No feature is complete without accompanying unit tests, integration tests, and (where applicable) tenant isolation tests. The test strategy in [docs/06-quality-and-security/testing-strategy.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/06-quality-and-security/testing-strategy.md) is mandatory.

11. **Maintain Documentation Concurrently**:  
    Whenever code, schema, API endpoints, or workflows are altered during authorized phases, update the corresponding documentation files, OpenAPI specs, and data dictionaries in the same commit.

12. **Adhere to WCAG 2.2 AA Accessibility**:  
    All frontend UI components must satisfy WCAG 2.2 AA standards: semantic markup, accessible names, keyboard navigation, focus management, visible focus rings, high contrast, and screen-reader compatibility.

13. **Human-in-the-Loop Safeguards for Student Support**:  
    Student support flags and intervention plans must always require human review and confirmation. Do not design or code autonomous algorithms that assign punitive or permanent diagnostic labels to students.

14. **Honest Reporting of Commands and Failures**:  
    Report command outputs, test failures, and linter errors completely and transparently. Never suppress test failures or claim that an action succeeded when it failed.

15. **Request Approval at Phase Gates**:  
    Upon completing all deliverables and acceptance criteria for an authorized phase, provide a comprehensive Phase Completion Report and request formal human review before progressing.

---

## 2. Phase 0 Concrete Enforcement

In this phase (Phase 0):
- **DO NOT** execute `npm init`, `npx create-vite`, `npm install`, or `docker run`.
- **DO NOT** generate `.ts`, `.tsx`, `.js`, `.json` configuration files (e.g. `package.json`, `tsconfig.json`).
- **DO NOT** generate Prisma schema files (`schema.prisma`) or SQL files.
- **DO NOT** produce visual prototypes or CSS stylesheets.
- **ONLY** produce Markdown (`.md`) documentation, Mermaid diagram source files (`.mmd`), and directory structures.
