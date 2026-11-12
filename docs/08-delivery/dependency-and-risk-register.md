# Dependency and Risk Register

This document tracks inter-phase technical dependencies, critical path constraints, and proactive risk mitigations for the **FSD-SDG-4 Quality Education SaaS** project.

---

## 1. Critical Path Analysis

The project's critical path is strictly dictated by the data and security foundation:

$$\text{Phase 0 (Arch)} \to \text{Phase 1 (Reqs)} \to \text{Phase 2 (UX Flows)} \to \text{Phase 4 (Scaffolding)} \to \text{Phase 5 (Database)} \to \text{Phase 6 (Backend)} \to \text{Phase 7 (Auth/Tenant)} \to \text{Phases 8-12 (Domains)} \to \text{Phase 13 (Frontend)} \to \text{Phase 15 (Hardening)} \to \text{Phase 16 (Release)}$$

- **Hard Dependency 1**: Domain APIs (Phases 8–12) cannot be built without Authentication, RBAC, and Tenant Isolation (Phase 7).
- **Hard Dependency 2**: Frontend integration (Phase 13) cannot begin without finalized backend contracts (Phases 7–12) and the accessible design system (Phase 3).
- **Hard Dependency 3**: Schema migrations (Phase 5) must be ratified before backend service development (Phase 6).

---

## 2. Risk Matrix and Action Plans

| Risk ID      | Risk Description                               |   Severity   | Likelihood | Impact Area        | Mitigation & Action Plan                                                                         | Trigger Condition                                               |
| :----------- | :--------------------------------------------- | :----------: | :--------: | :----------------- | :----------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| **R-DEP-01** | **Tenant Data Leakage via Raw Query**          | **Critical** |    Low     | Security & Legal   | Enforce Prisma query extension injecting `schoolId` into AST; automated CI isolation test suite. | Any endpoint added without isolation test.                      |
| **R-DEP-02** | **Attendance Load Stampede**                   |   **High**   |    High    | Availability       | Parameterized bulk insert endpoint; composite B-Tree indexes on `(school_id, section_id, date)`. | Morning attendance API P95 $> 300$ms.                           |
| **R-DEP-03** | **Accessibility Regressions in Complex Views** |   **High**   |   Medium   | Inclusivity / A11y | Headless accessible primitives; automated `axe-core` CI scans reporting zero violations.         | Any PR introducing unlabeled input or contrast $< 4.5:1$.       |
| **R-DEP-04** | **Stigmatizing Support Flags**                 |   **High**   |   Medium   | Pedagogical Value  | Human-in-the-loop review mandatory; transparent evidence explanations; non-punitive copy.        | User testing indicates students perceive flags as disciplinary. |
| **R-DEP-05** | **Client Bundle Bloat on 3G**                  |  **Medium**  |    High    | Performance        | Route-level code splitting via `React.lazy`; bundle budget CI check enforcing $\le 250$ KB.      | Production build bundle exceeds 250 KB gzipped.                 |
