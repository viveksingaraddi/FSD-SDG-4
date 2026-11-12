# Assumptions, Risks, and Open Questions (Phase 1 Validated)

This document registers the operational assumptions, technical and delivery risks, and open architectural/product decisions confronting the **FSD-SDG-4 Quality Education SaaS** platform following Phase 1 requirements validation.

---

## 1. Project Assumptions

1. **Target Infrastructure Environment**: The system deploys as a containerized Node.js application paired with a managed PostgreSQL 16+ instance in a single primary cloud region.
2. **Network Bandwidth Characteristics**: Primary institutional users access the platform on mobile devices over 3G cellular connections; initial client bundle must remain $\le 250\text{ KB}$ gzipped.
3. **Institutional Device Sharing**: Multiple teachers and students will share the same physical computer or tablet terminal in school computer labs; strict session termination on logout is mandatory.
4. **Tenant Scale**: Initial release targets up to 50 active school tenants, with each school supporting 200–2,000 students and 15–100 teachers.
5. **Human Pedagogical Discretion**: Educational support flags are advisory indicators requiring human validation; the system never assigns autonomous diagnostic labels.

---

## 2. Risk Register

| Risk ID         | Category    | Description                                                                                                                                 |   Severity   | Likelihood | Mitigation Strategy                                                                                                                               | Owner                |
| :-------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :----------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------- |
| **RSK-SEC-01**  | Security    | **Cross-Tenant Data Leakage**: Inadvertent omission of `school_id` filter in custom query exposes student records across schools.           | **Critical** |    Low     | Implement custom Prisma Client extension injecting `schoolId` into all queries; enforce multi-tenant isolation tests in CI before merge.          | Vivek / Vishwas      |
| **RSK-SEC-02**  | Security    | **Session Token Theft via XSS**: Compromised third-party client dependency captures session tokens.                                         |   **High**   |    Low     | Use strict `HttpOnly`, `Secure`, `SameSite=Lax` cookies; prohibit token storage in `localStorage`; configure strict Content Security Policy.      | Vivek                |
| **RSK-PRD-01**  | Product     | **Algorithmic Stigmatization**: Automated support flags perceived as punitive or permanent diagnostic labels by parents or students.        |   **High**   |   Medium   | User experience explicitly frames flags as "Support Opportunities"; require human review before publishing; omit diagnostic clinical language.    | Vishwanath           |
| **RSK-PERF-01** | Performance | **Attendance Stampede Latency**: All teachers across multiple schools submit morning attendance simultaneously between 8:00 AM and 8:30 AM. |  **Medium**  |    High    | Bulk insert endpoint for attendance records using PostgreSQL parameterized multi-row `INSERT`; database index on `(school_id, section_id, date)`. | Yashwardhan          |
| **RSK-A11Y-01** | Quality     | **Accessibility Regressions**: Complex data tables (attendance grid, gradebook) become unusable with screen readers or keyboards.           |   **High**   |   Medium   | Utilize headless accessible table primitives; enforce semantic ARIA table headers; include automated `axe-core` tests in CI.                      | Vishwanath / Vishwas |
| **RSK-OPS-01**  | Operations  | **Data Loss During Migration**: Erroneous Prisma migration script drops or corrupts tenant columns during staging or production upgrade.    | **Critical** |    Low     | Version-controlled SQL migration scripts; mandatory pre-migration automated database snapshots; rollback dry-runs in staging.                     | Yashwardhan          |

---

## 3. Open Product & Architectural Questions Tracker

| Question ID | Domain         | Open Question Description                                                                                        | Assigned Phase | Assigned Owner      | Options & Current Status                                                                                                                                                                                                                                                                     |
| :---------- | :------------- | :--------------------------------------------------------------------------------------------------------------- | :------------: | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OQ-001**  | Data / Tenancy | Should PostgreSQL Row-Level Security (RLS) be activated in Phase 5 alongside Prisma application filtering?       |    Phase 5     | Yashwardhan / Vivek | **Assigned to Phase 5**. Decision criteria: benchmark PgBouncer transaction-mode performance impact in Phase 5 staging spikes before deciding.                                                                                                                                               |
| **OQ-002**  | Product Scope  | What is the authorized scope of Parent / Guardian capabilities for the initial release?                          |  Phase 1 Gate  | Vishwanath          | **Pending Product Owner Approval**.<br>Option A: Keep full Parent Portal as P1 (Phase 14).<br>Option B: Introduce narrow P0 read-only attendance visibility. See [release-scope-decision.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/release-scope-decision.md). |
| **OQ-003**  | Frontend / UX  | Does the mobile attendance view require offline caching via Service Worker / IndexedDB for remote rural schools? |    Phase 2     | Vishwanath          | **Assigned to Phase 2**. Investigate user workflow complexity, conflict resolution, and cellular drop durations during Phase 2 user flow design.                                                                                                                                             |
| **OQ-004**  | Security       | What session duration and idle timeout policy balances school convenience with shared-device security?           |    Phase 7     | Vivek               | **Validated in Phase 1**. Enforce 8-hour absolute session expiration with a 60-minute idle warning dialog.                                                                                                                                                                                   |
