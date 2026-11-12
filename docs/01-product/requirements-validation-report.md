# Requirements Validation Report: Phase 1

**Phase**: `PHASE 1: Requirements Validation and Product Acceptance Criteria`  
**Date**: 2026-10-29  
**Authors**: Principal Product Architect, Business Analyst, QA Lead, Security Reviewer  
**Status**: Formal Review Draft — Awaiting Product Owner Sign-Off  
**Target Platform**: FSD-SDG-4 Quality Education SaaS

---

## 1. Executive Summary & Purpose

Following the successful audit and commit of Phase 0, Phase 1 validates every product capability, business boundary, user persona requirement, and failure mode for the **FSD-SDG-4 Quality Education SaaS** initial release.

This document serves as the formal validation report. It evaluates whether the established baseline satisfies the core pedagogical mission—connecting routine administration with meaningful, timely, human-reviewed student support ($\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$)—while strictly guarding against scope creep, unverified algorithmic diagnostic labeling, and premature full-scale ERP complexity.

---

## 2. Comprehensive Scope Validation by Functional Area

### 2.1 Identity, Authentication & Session Security (AUTH)

- **Problem Solved**: Educational institutions require secure, role-bounded access protecting minor student records without exposing shared classroom computers to credential theft or un-invalidated sessions.
- **Intended Users**: Platform Super Admin, School Admin, Teacher, Student, Parent (P1).
- **User Value**: Rapid, secure single-step authentication with guaranteed session termination on public/shared devices.
- **Required Inputs**: Institutional email, password, optional tenant subdomain identifier.
- **Expected Outputs**: Encrypted session cookie (`sid`), authenticated session context `{ userId, schoolId, role }`, user profile payload.
- **Business Rules**:
  - Max 5 failed attempts per 15-minute sliding window per IP/account.
  - Idle warning at 60 minutes; absolute session timeout at 8 hours.
  - Immediate server-side session record deletion upon logout.
- **Permissions**: Public access to login; authenticated access to session profile and logout.
- **Dependencies**: Database `users` and `sessions` tables; Argon2id hasher; Cookie parser middleware.
- **Failure & Edge Cases**: Expired session cookie; concurrent logins across multiple devices; account locked from brute-force attempts; tenant suspended.
- **Privacy & Accessibility**: Zero credential logging; WCAG 2.2 AA compliant login form with clear inline error messaging; password reveal toggle accessible via keyboard.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Biometric fingerprint authentication, hardware WebAuthn keys (P2 evaluation), third-party social logins (Google/Facebook OAuth excluded to prevent cross-site data harvesting).

---

### 2.2 School Setup & Academic Taxonomy (SCH)

- **Problem Solved**: Disorganized administrative spreadsheets prevent standardized classroom scheduling, teacher allocation, and longitudinal academic tracking.
- **Intended Users**: Platform Super Admin (tenant creation), School Admin (calendar & taxonomy setup).
- **User Value**: Clean institutional structure mapping academic years, grade levels (Classes), section cohorts, subjects, and course offerings.
- **Required Inputs**: School details, Academic year dates (start/end), Class names (e.g., Grade 8), Section names (e.g., 8-A), Subject codes (e.g., MATH-8), Course offering links.
- **Expected Outputs**: Active institutional calendar, structured course hierarchy ready for enrollment.
- **Business Rules**:
  - Only one Academic Year may hold `ACTIVE` status per school at any given time.
  - Class Sections must be linked to an active Academic Year.
  - Deleting an academic year with active section records is blocked (`RESTRICT`).
- **Permissions**: `SUPER_ADMIN` creates schools; `SCHOOL_ADMIN` configures institutional structure; `TEACHER` and `STUDENT` have read-only access.
- **Dependencies**: Multi-tenant data tier (`schools`, `academic_years`, `classes`, `sections`, `subjects`, `course_offerings`).
- **Failure & Edge Cases**: Overlapping academic year date ranges; duplicate subject codes; attempting to schedule offerings without assigned teachers.
- **Privacy & Accessibility**: Institutional metadata contains no student PII; tabular structures support screen-reader navigation and keyboard cell movement.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Complex timetable bell-schedule auto-generators, room reservation systems, multi-campus physical facility routing.

---

### 2.3 User, Staff & Enrollment Management (USR)

- **Problem Solved**: Schools struggle to maintain accurate rosters and prevent unauthorized personnel from viewing student transcripts.
- **Intended Users**: School Administrator.
- **User Value**: Centralized management of staff profiles, student admission records, and section roster assignments.
- **Required Inputs**: Staff profile data (employee ID, qualifications), student profile data (student ID number, admission date), roster assignment pairs.
- **Expected Outputs**: Generated user credentials, active section enrollment rosters.
- **Business Rules**:
  - `student_id_number` must be unique within the tenant (`UNIQUE(school_id, student_id_number)`).
  - Students can only be actively enrolled in one primary section per academic year.
  - User deletion is restricted to soft deactivation to preserve historical academic transcripts.
- **Permissions**: `SCHOOL_ADMIN` holds exclusive write permissions; teachers can view rosters for their assigned classes.
- **Dependencies**: Academic structure (`sections`, `academic_years`).
- **Failure & Edge Cases**: Duplicate student IDs; student transfer mid-term; deactivating a teacher with active ungraded assignments.
- **Privacy & Accessibility**: Strict student data minimization (no medical history or home financial data collected); clear tabular lists with pagination and search.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Government demographic census compliance reporting, automatic staff payroll processing.

---

### 2.4 Attendance Recording & Audit Ledger (ATT)

- **Problem Solved**: Paper attendance ledgers cause delayed truancy awareness, lost instructional time, and inaccurate reporting.
- **Intended Users**: Classroom Teachers, School Administrators, Students (view own).
- **User Value**: Rapid morning roster submission ($\le 90$ seconds for 30 students); immediate calculation of longitudinal attendance rates.
- **Required Inputs**: Section ID, date, student status array (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`), optional remark string.
- **Expected Outputs**: Persisted daily attendance records, updated rolling 30-day attendance rates, trigger evaluation for attendance support flags.
- **Business Rules**:
  - Max 1 daily record per student per calendar date.
  - UI defaults all students to `PRESENT` for rapid exception-based tagging.
  - Teachers may amend records for up to 5 calendar days; subsequent amendments require Admin authorization and audit log justification.
- **Permissions**: `TEACHER` (assigned sections only); `SCHOOL_ADMIN` (school-wide read/amend); `STUDENT` (read own).
- **Dependencies**: Enrollment rosters (`enrollments`, `sections`).
- **Failure & Edge Cases**: Weekend/holiday recording attempts; teacher absent (substitute teacher allocation); conflicting records for the same day.
- **Privacy & Accessibility**: Color chips accompanied by text labels and distinct icons (WCAG 1.4.1); high-contrast focus rings; touch targets $\ge 44 \times 44\text{px}$.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Biometric facial recognition/fingerprint timeclocks, GPS geofenced attendance tracking.

---

### 2.5 Learning Resource Management (RES)

- **Problem Solved**: Under-resourced schools lack equitable distribution of textbooks and supplemental reading materials.
- **Intended Users**: Teachers, Students.
- **User Value**: Centralized repository of syllabus reading guides, external educational URLs, and downloadable documents.
- **Required Inputs**: Course offering ID, title, resource type (Markdown text, URL, File attachment), content/file.
- **Expected Outputs**: Published resource accessible by all enrolled students.
- **Business Rules**:
  - File attachments restricted to approved MIME types (PDF, DOCX, PNG) with maximum size $5\text{ MB}$.
  - Resources can exist in `DRAFT` or `PUBLISHED` status.
- **Permissions**: `TEACHER` creates and curates; `STUDENT` reads published resources for enrolled courses.
- **Dependencies**: Course offerings (`course_offerings`), Object storage service.
- **Failure & Edge Cases**: Corrupted file upload; broken external link; attempting to upload executable files (`.exe`, `.sh`).
- **Privacy & Accessibility**: File attachments checked for malware; markdown guides rendered with accessible heading tags.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: SCORM-compliant e-learning authoring tools, embedded interactive simulation engines.

---

### 2.6 Assignments, Submissions & Digital Grading (ASN)

- **Problem Solved**: Homework loss, delayed teacher feedback, and untracked late submissions impede academic mastery.
- **Intended Users**: Teachers, Students.
- **User Value**: Transparent coursework publishing, mobile submission for students, and structured digital grading with qualitative feedback.
- **Required Inputs**:
  - _Teacher_: Title, instructions, max points, due date, attachments.
  - _Student_: Text response, file upload.
  - _Grading_: Score, qualitative pedagogical feedback.
- **Expected Outputs**: Graded submission records, updated student gradebooks, feedback notifications.
- **Business Rules**:
  - Submissions past due date stamped `LATE`.
  - Scores bound by $0 \le \text{Score} \le \text{Max Points}$.
  - Scores below 50% strongly prompt for explanatory pedagogical feedback.
- **Permissions**: `TEACHER` creates assignments and grades; `STUDENT` submits and views own grades.
- **Dependencies**: Course offerings, student enrollments.
- **Failure & Edge Cases**: File upload failure on slow 3G network; student resubmission before deadline; grading when student was un-enrolled.
- **Privacy & Accessibility**: Students strictly prohibited from seeing peer submissions or peer grades; accessible drawer interface for grading.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Automated AI essay grading, third-party plagiarism detection services.

---

### 2.7 Assessments & Consolidated Gradebook (ASM)

- **Problem Solved**: Fragmented test scoring prevents early detection of conceptual learning gaps across subject terms.
- **Intended Users**: Teachers, School Administrators, Students.
- **User Value**: Formal test management with subject weighting, letter grade derivation, and a consolidated section gradebook view.
- **Required Inputs**: Assessment title, type (Quiz, Unit Test, Midterm, Final), weight percentage, total marks, student scores.
- **Expected Outputs**: Persisted assessment results, consolidated gradebook matrix, aggregated course averages.
- **Business Rules**:
  - Cumulative assessment weights per course offering should sum to 100%.
  - Gradebook aggregations update asynchronously to maintain $\le 600\text{ ms}$ P95 latency.
- **Permissions**: `TEACHER` enters results; `SCHOOL_ADMIN` oversees school-wide gradebooks; `STUDENT` views own results.
- **Dependencies**: Course offerings, enrollments.
- **Failure & Edge Cases**: Assessment weight exceeds 100%; missing scores for absent students (marked as Incomplete / Absent).
- **Privacy & Accessibility**: Responsive gradebook table collapses into accessible cards on mobile viewports.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Standardized national testing integrations, curved grading algorithms.

---

### 2.8 Student Progress & Longitudinal Synthesis (PRG)

- **Problem Solved**: Teachers evaluate grades and attendance in isolation, failing to recognize systemic disengagement trends.
- **Intended Users**: Teachers, School Administrators, Students, Parents (P1).
- **User Value**: Real-time synthesized profile showing rolling attendance percentage, coursework submission rate, and assessment average.
- **Required Inputs**: Longitudinal attendance records, assignment scores, assessment results.
- **Expected Outputs**: Standardized `ProgressSnapshot` record per student per active term.
- **Business Rules**:
  - Snapshots calculated deterministically without opaque weighting formulas.
  - Missing assignments count as $0\%$ for completion rate calculations.
- **Permissions**: Teachers view assigned students; Admins view all; Students view own.
- **Dependencies**: Attendance engine, Coursework module, Assessment module.
- **Failure & Edge Cases**: Student newly admitted with $< 5$ days of data (insufficient baseline alert).
- **Privacy & Accessibility**: High-contrast progress bars with numeric text equivalents for screen readers.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Predictive machine-learning career forecasting, comparative class ranking leaderboards (excluded to prevent toxic competition).

---

### 2.9 Student Support Flags & Intervention Plans (FLG / PLN)

- **Problem Solved**: Struggling learners fall through administrative cracks; intervention happens too late or remains unstructured and unreviewed.
- **Intended Users**: Teachers, Counselors, School Administrators.
- **User Value**: Early detection of risk factors through explainable, advisory flags, followed by structured, time-bound SMART support plans.
- **Required Inputs**:
  - _System Flag_: Trigger condition data (dates, absences, missed tasks).
  - _Human Review_: Decision (`CONFIRMED` / `DISMISSED`) + mandatory text justification.
  - _Support Plan_: Problem statement, lead educator, SMART target goals, action items, review date.
  - _Milestone Review_: Outcome status (`RESOLVED`, `CONTINUED`, `ESCALATED`) + review notes.
- **Expected Outputs**: Transparent flag record, active Support Plan, assignable action items, closed-loop milestone record.
- **Business Rules**:
  - **Zero Autonomous Labeling**: System flags are strictly `PROPOSED` until reviewed by a human educator.
  - Dismissing a flag requires mandatory written rationale.
  - Support Plans require a scheduled review date $\le 30$ calendar days.
  - Interventions are non-punitive and excluded from public student transcripts.
- **Permissions**: `TEACHER` and `SCHOOL_ADMIN` can review flags and author plans; `STUDENT` can view assigned personal recovery goals.
- **Dependencies**: Progress snapshots, user profiles, audit engine.
- **Failure & Edge Cases**: Flag triggers while a student already has an active support plan for the same issue (flag groups into existing plan); educator forgets review date (system surfaces review alert).
- **Privacy & Accessibility**: Confidential pastoral records; plain language copy ($\le$ 8th grade reading level); non-stigmatizing visual design.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Diagnostic clinical psychiatric labeling, autonomous disciplinary actions (detentions, suspensions).

---

### 2.10 Role-Specific Dashboards (DSH)

- **Problem Solved**: Information overload from generic dashboards obscures urgent morning operational tasks.
- **Intended Users**: All authenticated roles.
- **User Value**: Contextual, actionable home screen surfacing priority queues (e.g. Teacher: pending morning attendance, unreviewed flags).
- **Required Inputs**: Authenticated user session context.
- **Expected Outputs**: Role-tailored widget grid (Pending tasks, attendance summary, schedule, feedback cards).
- **Business Rules**:
  - Dashboard load time must achieve P95 $\le 200\text{ ms}$.
  - Widgets degrade gracefully if underlying sub-service is slow.
- **Permissions**: Strict role partitioning.
- **Dependencies**: All functional modules.
- **Failure & Edge Cases**: Empty state on first day of term; slow network on mobile terminal.
- **Privacy & Accessibility**: Skip link directly to dashboard content; semantic headings; responsive layout down to 320px.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: User-customizable drag-and-drop widget layouts (premature complexity).

---

### 2.11 Audit Logging & Compliance (AUD)

- **Problem Solved**: Inability to resolve disputes or trace fraudulent grade or attendance changes.
- **Intended Users**: School Administrators, Platform Super Admins.
- **User Value**: Complete, immutable, tamper-evident audit trail of all sensitive operations.
- **Required Inputs**: Actor ID, action type, entity name, entity ID, before/after state delta, client IP, timestamp.
- **Expected Outputs**: Append-only log records queryable by administrators.
- **Business Rules**:
  - Audit records are strictly append-only; update and delete operations are prohibited.
  - Retained for 90 days online; archived thereafter.
- **Permissions**: `SCHOOL_ADMIN` (tenant-scoped); `SUPER_ADMIN` (platform-scoped).
- **Dependencies**: Database `audit_logs` table.
- **Failure & Edge Cases**: High-volume mutation flooding audit table (asynchronous decoupled writing).
- **Privacy & Accessibility**: Audit payloads sanitize passwords and session cookies; filterable tabular view with accessible dates.
- **Priority**: **P0 (Core Initial Release)**.
- **Out-of-Scope**: Real-time SIEM socket streaming, blockchain-based ledger storage.

---

### 2.12 Parent / Guardian Portal (PAR)

- **Problem Solved**: Families are disconnected from student attendance and academic challenges until formal report cards arrive.
- **Intended Users**: Parents, Guardians, Family Caregivers.
- **User Value**: Read-only mobile window into daily attendance, published assignment feedback, and active home-support milestones.
- **Required Inputs**: Guardian credentials, verified relationship link to student.
- **Expected Outputs**: Child summary cards, attendance calendars, active support goals.
- **Business Rules**:
  - Guardians can only access verified linked children (`GuardianRelationship`).
  - Access is strictly read-only; cannot modify attendance, grades, or teacher notes.
  - Draft or unconfirmed support flags are hidden from parents until formalized into an active plan.
- **Permissions**: `PARENT` role.
- **Dependencies**: Identity module, Student profiles, Guardian relationship table.
- **Failure & Edge Cases**: Guardian linked to multiple students across different grades; unverified guardian link claim.
- **Privacy & Accessibility**: Zero visibility into classmates' data; mobile-first interface optimized for budget smartphones.
- **Priority**: **Classified as P1 (Secondary Release)** — Subject to OQ-002 decision.
- **Out-of-Scope**: Two-way real-time parent-teacher chat, fee payment processing.

---

## 3. Scope Boundary Summary Table

| Functional Capability                | Priority Classification | Justification / Phase Target                                                                |
| :----------------------------------- | :---------------------: | :------------------------------------------------------------------------------------------ |
| **Multi-Tenant Auth & Sessions**     |         **P0**          | Non-negotiable security baseline. Target: Phase 7.                                          |
| **School Setup & Academic Taxonomy** |         **P0**          | Essential data architecture foundation. Target: Phase 8.                                    |
| **Staff & Student Management**       |         **P0**          | Roster prerequisite for all classroom workflows. Target: Phase 9.                           |
| **Daily Attendance Engine**          |         **P0**          | Primary daily operational touchpoint. Target: Phase 10.                                     |
| **Learning Resource Management**     |         **P0**          | Core educational distribution channel. Target: Phase 10.                                    |
| **Assignments & Digital Grading**    |         **P0**          | Direct academic evaluation loop. Target: Phase 11.                                          |
| **Assessments & Gradebook Matrix**   |         **P0**          | Longitudinal academic mastery tracking. Target: Phase 11.                                   |
| **Student Progress Calculation**     |         **P0**          | Quantitative foundation for early risk detection. Target: Phase 12.                         |
| **Support Flags, Plans & Reviews**   |         **P0**          | **Primary pedagogical value proposition of the SaaS.** Target: Phase 12.                    |
| **Role-Specific Dashboards**         |         **P0**          | Ergonomic operational interface. Target: Phase 13.                                          |
| **Audit Logging Engine**             |         **P0**          | Regulatory accountability and dispute resolution. Target: Phase 7/8.                        |
| **Parent / Guardian Portal**         |         **P1**          | High value but secondary to school operational core. Target: Phase 14 (or OQ-002 Option B). |
| **Automated SMS/Email Alerts**       |         **P1**          | Secondary operational enhancement. Target: Phase 14.                                        |
| **Bulk CSV Import/Export**           |         **P1**          | Administrative onboarding acceleration. Target: Phase 14.                                   |
| **Offline Attendance Syncing**       |         **P2**          | Architectural spike in Phase 2; evaluated post-core.                                        |
| **Curriculum Standard Mapping**      |         **P2**          | Future enhancement for national curriculum frameworks.                                      |
| **Fee Invoicing & Payment Gateways** |      **EXCLUDED**       | Non-goal; adds PCI-DSS bloat unrelated to SDG-4.                                            |
| **Video Conferencing / Streaming**   |      **EXCLUDED**       | Non-goal; replicated by external meeting links.                                             |
| **Autonomous AI Essay Grading**      |      **EXCLUDED**       | Non-goal; violates human pedagogical integrity.                                             |
