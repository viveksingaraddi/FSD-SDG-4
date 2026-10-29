# Assumptions, Risks, and Open Questions

This document registers the critical operational assumptions, technical and delivery risks, and open architectural questions confronting the FSD-SDG-4 Quality Education SaaS platform at the conclusion of Phase 0.

---

## 1. Project Assumptions

1. **Target Infrastructure Environment**: The system will initially deploy as a containerized Node.js application paired with a managed PostgreSQL instance (e.g., AWS RDS, Supabase Postgres, or digital ocean managed database) operating in a single primary cloud region.
2. **Network Bandwidth Characteristics**: Primary institutional users (teachers and students) may access the platform from mobile devices on 3G or low-tier broadband connections. Client bundles and image assets must be minimized accordingly.
3. **Institutional Device Sharing**: In many target schools, multiple teachers and students will share the same physical computer or tablet terminal. The frontend must treat client persistence defensively.
4. **Tenant Scale**: The initial release targets up to 50 active school tenants, with each school supporting 200–2,000 students and 15–100 teachers. High-volume enterprise multi-region sharding is unnecessary for early phases.
5. **Human Pedagogical Integrity**: Educators and school administrators are committed to reviewing student support interventions; the system will not replace educational counseling with autonomous scoring.

---

## 2. Risk Register

| Risk ID | Category | Description | Severity | Likelihood | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **RSK-SEC-01** | Security | **Cross-Tenant Data Leakage**: Inadvertent omission of `school_id` filter in a custom ORM query exposes student records across schools. | **Critical** | Low | Implement custom Prisma Client extension injecting `schoolId` into all queries; enforce multi-tenant isolation tests in CI before merge. | Vivek / Vishwas |
| **RSK-SEC-02** | Security | **Session Token Theft via XSS**: Compromised third-party client dependency captures session tokens. | **High** | Low | Use strict `HttpOnly`, `Secure`, `SameSite=Lax` cookies; prohibit token storage in `localStorage`; configure strict Content Security Policy. | Vivek |
| **RSK-PRD-01** | Product | **Algorithmic Stigmatization**: Automated support flags perceived as punitive or permanent diagnostic labels by parents or students. | **High** | Medium | User experience explicitly frames flags as "Support Opportunities"; require human review before publishing; omit diagnostic clinical language. | Vishwanath |
| **RSK-PERF-01**| Performance | **Attendance Stampede Latency**: All teachers across multiple schools submit morning attendance simultaneously between 8:00 AM and 8:30 AM. | **Medium** | High | Bulk insert endpoint for attendance records using PostgreSQL `COPY` or parameterized multi-row `INSERT`; database index on `(school_id, class_section_id, date)`. | Yashwardhan |
| **RSK-A11Y-01**| Quality | **Accessibility Regressions**: Complex data tables (e.g. attendance grid, gradebook) become unusable with screen readers or keyboards. | **High** | Medium | Utilize headless accessible table primitives; enforce semantic ARIA table headers; include automated `axe-core` tests in CI. | Vishwanath / Vishwas |
| **RSK-OPS-01** | Operations | **Data Loss During Migration**: Erroneous Prisma migration script drops or corrupts tenant columns during staging or production upgrade. | **Critical** | Low | Version-controlled SQL migration scripts; mandatory pre-migration automated database snapshots; rollback dry-runs in staging. | Yashwardhan |

---

## 3. Open Questions & Decision Log Tracker

| Question ID | Domain | Open Question Description | Impacted Phase | Assigned Owner | Proposed Resolution Path |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **OQ-001** | Data / Tenancy | Should PostgreSQL Row-Level Security (RLS) be activated in Phase 5 alongside Prisma application filtering? | Phase 5 | Yashwardhan / Vivek | Benchmark PgBouncer transaction-mode performance impact in Phase 5 staging spikes before deciding. |
| **OQ-002** | Product | When should the Parent / Guardian Portal be made available to pilot schools? | Phase 1 & 14 | Vishwanath | Keep in P1 scope for Phase 14 unless pilot schools in Phase 1 establish parent attendance alerts as a non-negotiable launch blocker. |
| **OQ-003** | Frontend / UX | Does the mobile attendance view require offline caching via Service Worker / IndexedDB for remote rural schools? | Phase 2 & 10 | Vishwanath | Investigate client complexity trade-offs during Phase 2 user flow design; prototype local cache sync if field data indicates severe disconnects. |
| **OQ-004** | Security | What session duration and idle timeout policy balances school convenience with shared-device security? | Phase 7 | Vivek | Propose 8-hour absolute session expiration with a 60-minute idle warning dialog to accommodate full-day school teaching sessions. |
