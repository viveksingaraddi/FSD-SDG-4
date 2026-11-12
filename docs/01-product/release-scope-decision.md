# Release Scope and Open Decisions Framework

This document structures the critical architectural, scope, and technical trade-offs confronting the **FSD-SDG-4 Quality Education SaaS** project at the conclusion of Phase 1.

> **GOVERNANCE NOTICE**:  
> In accordance with Phase 1 rules, the decisions below are presented with comprehensive trade-off analyses for formal review. **No option has been unilaterally selected; all options are recorded as awaiting explicit Product Owner and Stakeholder approval.**

---

## 1. Open Decision OQ-002: Parent/Guardian Capability Scope

### Context & Problem Statement

Educational research emphasizes that family involvement significantly improves attendance recovery and academic outcomes. However, integrating parent accounts into an early-stage SaaS introduces significant complexity regarding minor privacy verification, guardian onboarding workflows, role authorization, and notification pipelines.

---

### Option A: Retain the Entire Parent/Guardian Portal as Priority P1 (Phase 14)

Under Option A, the initial P0 release focuses exclusively on school-internal workflows (School Admin, Teacher, Student). Parent accounts, guardian relationships, and family-facing screens are deferred to Phase 14.

#### Architectural & Delivery Implications

- **Student Privacy & Verification**: Lowest operational risk. Schools do not need to verify guardian legal custody or email identities during initial pilot launch.
- **Backend Permissions**: Clean 3-tier RBAC for schools (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`). No complex polymorphic guardian-to-multi-student lookup middleware.
- **UI & Workflow Complexity**: Eliminates 4 screens (`SCR-PAR-01` to `SCR-PAR-04`), multi-child switcher navigation, and parent onboarding flows from the initial build.
- **Notification Requirements**: Zero external SMS/Email notification infrastructure required for P0; teachers conduct pastoral check-ins via traditional institutional channels.
- **Testing Effort**: Reduces automated test matrix by approximately $25\%$.
- **Release Velocity**: Minimizes time-to-pilot, enabling earlier validation of teacher morning attendance and the core student support loop.

---

### Option B: Introduce Narrowly Defined P0 Read-Only Attendance Visibility for Parents

Under Option B, a minimal subset of the parent capability is pulled into the P0 core: verified guardians receive secure, read-only mobile access strictly to view their child's daily attendance records and absence notifications. All gradebook views, coursework submission details, and interactive support plan authoring remain deferred to P1 (Phase 14).

#### Architectural & Delivery Implications

- **Student Privacy & Verification**: Requires implementing formal legal guardian verification during student onboarding to prevent unauthorized third parties from tracking minor location/attendance.
- **Backend Permissions**: Introduces `PARENT` role in Phase 7; requires data-access middleware enforcing `WHERE student_id IN (SELECT student_id FROM guardian_relationships WHERE guardian_user_id = session.user_id)`.
- **UI & Workflow Complexity**: Adds a simplified, mobile-first single-child attendance view (`SCR-PAR-02`) and invitation acceptance screen to the P0 frontend.
- **Notification Requirements**: Requires provisioning transactional email/SMS dispatch in Phase 10/14 to alert parents when a student is marked `ABSENT` without excuse.
- **Testing Effort**: Increases test scope: requires dedicated parent-student isolation test suites asserting Parent A cannot view Attendance for Student B.
- **Release Velocity**: Extends the initial P0 development timeline by approximately 2–3 weeks.

---

### Comparative Evaluation Matrix for OQ-002

| Evaluation Dimension      | Option A: Full P1 (Phase 14)               | Option B: Narrow P0 Attendance Visibility            |
| :------------------------ | :----------------------------------------- | :--------------------------------------------------- |
| **Minor Privacy Risk**    | **Minimal** (School staff only)            | **Moderate** (Requires verified custody link)        |
| **RBAC Complexity**       | Low (Standard school hierarchy)            | Medium (Guardian-to-Student mapping required)        |
| **P0 Screen Count**       | 24 Screens                                 | 26 Screens (+ Parent Dashboard & Attendance)         |
| **External Integrations** | None (Self-contained)                      | Notification Gateway (SMTP/SMS)                      |
| **QA Test Suite Volume**  | Baseline ($\approx 120$ integration tests) | Elevated ($\approx 155$ integration tests)           |
| **Pilot School Feedback** | Staff-focused operational pilot            | High community engagement; earlier family visibility |
| **Current Status**        | **AWAITING PO APPROVAL**                   | **AWAITING PO APPROVAL**                             |

---

## 2. Open Decision OQ-001: PostgreSQL Row-Level Security (RLS) Evaluation

- **Assigned Phase**: **Phase 5 (Database Schema Design & Migrations)**.
- **Context**: The platform's baseline architecture enforces tenant isolation at the application data-access layer (Ring 3: Prisma AST extension). RLS provides an optional kernel-level defense-in-depth ring (Ring 4).
- **Decision Criteria for Phase 5**:
  1. _Connection Pool Benchmarking_: Measure latency impact of executing `SET LOCAL app.current_school_id = ...` on transaction-mode pooled PgBouncer connections.
  2. _Tooling Compatibility_: Verify Prisma migration and introspection compatibility with native PostgreSQL RLS policies.
  3. _Recommendation Target_: If connection pool overhead is $< 5\%$ and tooling is seamless, activate RLS in Phase 5; otherwise, retain application-layer Prisma extension as the authoritative boundary with automated CI isolation tests.

---

## 3. Open Decision OQ-003: Offline Attendance Synchronization Strategy

- **Assigned Phase**: **Phase 2 (Information Architecture & User Flows)**.
- **Context**: Teachers in remote rural environments may experience cellular connectivity drops during morning attendance.
- **User Needs to Investigate in Phase 2**:
  - What is the typical duration of cellular drops in target pilot schools (minutes vs. days)?
  - Is local IndexedDB queueing with Service Worker background sync necessary, or is a lightweight client-side memory retry banner sufficient?
- **Decision Criteria for Phase 2**:
  - Evaluate UX state complexity (handling conflict resolution if attendance was submitted by a substitute teacher online while offline queue was pending).
  - Defer full PWA Service Worker caching implementation to Phase 10/P2 unless field interviews prove essential for pilot launch.
