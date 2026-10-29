# Functional Requirements Catalog

This document establishes the authoritative functional requirements for the **FSD-SDG-4 Quality Education SaaS** platform. Each requirement has a unique, stable identifier for end-to-end traceability across architecture, data entities, API endpoints, and test suites.

---

## 1. Identity, Authentication & Access Control (AUTH)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-AUTH-001** | Multi-Tenant Sign-In | Users authenticate using institutional email and password, establishing an encrypted server-managed session tied to their school tenant. | **P0** |
| **FR-AUTH-002** | Secure Session Cookies | Session tokens are delivered exclusively via `HttpOnly`, `Secure`, `SameSite=Lax` cookies; tokens are never accessible to client-side scripts. | **P0** |
| **FR-AUTH-003** | Argon2id Hashing | All user passwords must be hashed using Argon2id with calibrated work parameters before database persistence. | **P0** |
| **FR-AUTH-004** | Role-Based Authorization | The system strictly enforces endpoint and view access based on user role (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`). | **P0** |
| **FR-AUTH-005** | Explicit Tenant Scoping | The system verifies that non-super-admin users can only query and mutate records belonging to their authenticated `school_id`. | **P0** |
| **FR-AUTH-006** | Session Invalidation | Users can explicitly log out, immediately destroying the server session in the database and clearing the client-side session cookie. | **P0** |
| **FR-AUTH-007** | Brute-Force Rate Limiting | Authentication endpoints enforce IP- and account-based rate limiting (max 5 failed attempts per 15-minute window) with progressive backoff. | **P0** |
| **FR-AUTH-008** | Password Reset Flow | Users can initiate a secure, time-limited, single-use password reset token delivered out-of-band. | **P1** |

---

## 2. School Setup & Academic Structure (SCH)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-SCH-001** | School Tenant Registration| Super Admin can register a new school tenant with official name, domain, address, contact details, and initial admin credentials. | **P0** |
| **FR-SCH-002** | Academic Year Lifecycle | School Admin can create and manage Academic Years (e.g., 2026–2027) with defined start/end dates and status (`PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`). | **P0** |
| **FR-SCH-003** | Class & Section Structure| School Admin can define Classes (grade levels, e.g., Grade 8) and Sections (e.g., Section 8-A, 8-B) assigned to an Academic Year. | **P0** |
| **FR-SCH-004** | Subject Curriculum Catalog| School Admin can define academic Subjects (e.g., Mathematics, English Literature, Integrated Science) with curriculum codes. | **P0** |
| **FR-SCH-005** | Course Offerings | School Admin can create Course Offerings linking a Subject, a Class Section, an Academic Year, and one or more assigned Teachers. | **P0** |

---

## 3. User & Enrollment Management (USR)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-USR-001** | Staff Profile Management | School Admin can provision Teacher profiles with employee IDs, contact info, qualifications, and system accounts. | **P0** |
| **FR-USR-002** | Student Profile Management| School Admin can provision Student profiles with student identification numbers, admission dates, and grade levels. | **P0** |
| **FR-USR-003** | Section Roster Enrollment | School Admin can enroll students into specific class sections for an active Academic Year. | **P0** |
| **FR-USR-004** | Guardian Relationship Link | Administrators can link Parent/Guardian profiles to one or more Student profiles with specified relationship types (e.g., Mother, Father, Guardian). | **P1** |
| **FR-USR-005** | User Account Deactivation | School Admin can deactivate staff or student accounts, terminating active sessions without destroying historical academic records. | **P0** |

---

## 4. Attendance Recording & Oversight (ATT)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-ATT-001** | Daily Section Attendance | Teachers can record daily attendance for all students enrolled in their assigned class sections. | **P0** |
| **FR-ATT-002** | Standardized Status Types | Attendance status options must include: `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED`, with optional explanatory remarks. | **P0** |
| **FR-ATT-003** | Fast Bulk Roster Submission| The interface defaults to `PRESENT` for all students, allowing teachers to rapidly toggle absent/late students and submit the entire roster in a single request. | **P0** |
| **FR-ATT-004** | Attendance History & Audit | Teachers and School Admins can view and amend past attendance records within an allowed edit window, with all edits recorded in the audit log. | **P0** |
| **FR-ATT-005** | Longitudinal Attendance Rate| The system automatically computes rolling 30-day and term-to-date attendance percentages for each student. | **P0** |

---

## 5. Learning Resource Repository (RES)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-RES-001** | Resource Creation | Teachers can publish learning resources associated with a specific Subject or Course Offering. | **P0** |
| **FR-RES-002** | Multi-Format Resources | Resources support rich-text markdown guides, external educational URLs, and uploaded document attachments (PDF, DOCX). | **P0** |
| **FR-RES-003** | Student Resource Access | Students can search, filter by subject, and download/read published resources for their enrolled courses. | **P0** |
| **FR-RES-004** | Resource Status Toggles | Teachers can draft, publish, or archive learning resources to control visibility. | **P0** |

---

## 6. Assignments, Submissions & Grading (ASN)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-ASN-001** | Assignment Publishing | Teachers can create assignments with titles, rich instructions, maximum points, due dates, and attachment references. | **P0** |
| **FR-ASN-002** | Digital Submission | Enrolled students can submit assignments digitally via text entry or file upload before the deadline. | **P0** |
| **FR-ASN-003** | Late Submission Tracking | Submissions received after the deadline are automatically flagged as `LATE` with timestamp logging. | **P0** |
| **FR-ASN-004** | Assignment Grading | Teachers can assign numerical points and publish grades to students. | **P0** |
| **FR-ASN-005** | Structured Feedback | Teachers can attach qualitative pedagogical feedback and constructive guidance to student submissions. | **P0** |

---

## 7. Assessments & Examination Results (ASM)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-ASM-001** | Assessment Definition | Teachers or Admins can define formal assessments (quizzes, unit tests, mid-terms, final exams) with weightings and total marks. | **P0** |
| **FR-ASM-002** | Assessment Result Entry | Teachers can record student scores, letter grades, and qualitative notes for scheduled assessments. | **P0** |
| **FR-ASM-003** | Gradebook Overview | Teachers can view a consolidated tabular gradebook for an entire class section showing all assessments and aggregated averages. | **P0** |

---

## 8. Student Progress, Support Flags & Intervention Plans (FLG / PLN)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-FLG-001** | Rule-Based Support Flags | The system automatically generates advisory Support Flags when a student breaches objective criteria (e.g. attendance < 75%, $\ge 3$ consecutive missing assignments, failing assessment average). | **P0** |
| **FR-FLG-002** | Transparent Explanation | Every generated flag must include human-readable rationale citing the exact evidence (e.g., dates of absences, specific failed tests). | **P0** |
| **FR-FLG-003** | Mandatory Human Review | Support Flags remain in `PROPOSED` status until a teacher or counselor reviews and either `CONFIRMS` (initiating intervention), `DISMISSES` (with recorded justification), or `AMENDS` the flag. | **P0** |
| **FR-PLN-001** | Support Plan Creation | Teachers can create a formal Support Plan for a student with identified challenge areas, a designated lead educator, and SMART target goals. | **P0** |
| **FR-PLN-002** | Action Item Tracking | Support Plans contain concrete, assignable Action Items with target completion dates and status toggles (`PENDING`, `IN_PROGRESS`, `COMPLETED`). | **P0** |
| **FR-PLN-003** | Scheduled Review Cycle | Support Plans enforce a mandatory review date (e.g., 14 or 30 days) where educators assess progress and mark the plan as `RESOLVED`, `CONTINUED`, or `ESCALATED`. | **P0** |

---

## 9. Dashboards & System Auditing (DSH / AUD)

| Identifier | Requirement Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-DSH-001** | Role-Tailored Dashboards | Each role lands on a customized dashboard displaying their primary action queue (e.g., Teacher: pending attendance, unflagged alerts; Student: upcoming assignments). | **P0** |
| **FR-AUD-001** | Immutable Audit Trail | The system writes an append-only audit record for all authentication events, grade alterations, attendance overrides, and support plan status transitions. | **P0** |
