# Functional Requirements Catalog (Phase 1 Validated)

This document establishes the validated functional requirements catalog for the **FSD-SDG-4 Quality Education SaaS** platform. Each requirement maintains a stable identifier linked to testable Gherkin acceptance criteria in [feature-acceptance-criteria.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/feature-acceptance-criteria.md).

---

## 1. Identity, Authentication & Access Control (AUTH)

| Identifier      | Requirement Name          | Description                                                                                                                              | Priority | Testable Criteria Ref | Phase 1 Status |
| :-------------- | :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-AUTH-001** | Multi-Tenant Sign-In      | Users authenticate using institutional email and password, establishing an encrypted server-managed session tied to their school tenant. |  **P0**  | `AC-AUTH-01`          | **Validated**  |
| **FR-AUTH-002** | Secure Session Cookies    | Session tokens delivered exclusively via `HttpOnly`, `Secure`, `SameSite=Lax` cookies; tokens never accessible to client-side scripts.   |  **P0**  | `AC-AUTH-01`          | **Validated**  |
| **FR-AUTH-003** | Argon2id Hashing          | All user passwords hashed using Argon2id ($m=64\text{MB}, t=3, p=4$) before persistence.                                                 |  **P0**  | `AC-AUTH-01`          | **Validated**  |
| **FR-AUTH-004** | Role-Based Authorization  | Strict enforcement of endpoint permissions across `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.                         |  **P0**  | `AC-AUTH-04`          | **Validated**  |
| **FR-AUTH-005** | Explicit Tenant Scoping   | Non-super-admin users can query and mutate records strictly belonging to their authenticated session `school_id`.                        |  **P0**  | `AC-AUTH-05`          | **Validated**  |
| **FR-AUTH-006** | Session Invalidation      | User logout immediately destroys server session in database and clears the client session cookie.                                        |  **P0**  | `AC-UI-03`            | **Validated**  |
| **FR-AUTH-007** | Brute-Force Rate Limiting | Authentication endpoints enforce sliding-window rate limiting (max 5 failed attempts per 15-minute window).                              |  **P0**  | `AC-AUTH-03`          | **Validated**  |
| **FR-AUTH-008** | Password Reset Flow       | Out-of-band password reset via time-limited, single-use cryptographic token.                                                             |  **P1**  | `AC-AUTH-06`          | **Validated**  |

---

## 2. School Setup & Academic Structure (SCH)

| Identifier     | Requirement Name           | Description                                                                                                    | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-SCH-001** | School Tenant Registration | Super Admin can register a new school tenant with official name, domain, address, and initial admin account.   |  **P0**  | `AC-SCH-01`           | **Validated**  |
| **FR-SCH-002** | Academic Year Lifecycle    | School Admin can create and manage Academic Years with status (`PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`).  |  **P0**  | `AC-SCH-01`           | **Validated**  |
| **FR-SCH-003** | Class & Section Structure  | School Admin can define Classes (grade levels) and Sections (classroom cohorts) assigned to an Academic Year.  |  **P0**  | `AC-SCH-02`           | **Validated**  |
| **FR-SCH-004** | Subject Curriculum Catalog | School Admin can define academic curriculum subjects with unique institutional subject codes.                  |  **P0**  | `AC-SCH-03`           | **Validated**  |
| **FR-SCH-005** | Course Offerings           | School Admin can create Course Offerings linking Subject, Class Section, Academic Year, and assigned Teachers. |  **P0**  | `AC-SCH-04`           | **Validated**  |

---

## 3. User & Enrollment Management (USR)

| Identifier     | Requirement Name           | Description                                                                                                     | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :------------------------- | :-------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-USR-001** | Staff Profile Management   | School Admin can provision Teacher profiles with employee IDs, contact info, qualifications, and accounts.      |  **P0**  | `AC-USR-01`           | **Validated**  |
| **FR-USR-002** | Student Profile Management | School Admin can provision Student profiles with unique student ID numbers, admission dates, and grade levels.  |  **P0**  | `AC-USR-01`           | **Validated**  |
| **FR-USR-003** | Section Roster Enrollment  | School Admin can enroll students into specific class sections for the active Academic Year.                     |  **P0**  | `AC-USR-01`           | **Validated**  |
| **FR-USR-004** | Guardian Relationship Link | Link Parent/Guardian profiles to one or more Student profiles with verified relationship types.                 |  **P1**  | `AC-PAR-01`           | **Validated**  |
| **FR-USR-005** | User Account Deactivation  | School Admin can deactivate accounts, terminating active sessions while preserving historical academic records. |  **P0**  | `AC-USR-02`           | **Validated**  |

---

## 4. Attendance Recording & Oversight (ATT)

| Identifier     | Requirement Name             | Description                                                                                                              | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :--------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-ATT-001** | Daily Section Attendance     | Teachers can record daily attendance for all students enrolled in their assigned class sections in $\le 90$s.            |  **P0**  | `AC-ATT-01`           | **Validated**  |
| **FR-ATT-002** | Standardized Status Types    | Statuses strictly `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED`, with optional explanatory remarks.                         |  **P0**  | `AC-ATT-01`           | **Validated**  |
| **FR-ATT-003** | Fast Bulk Roster Submission  | UI defaults to `PRESENT` for all students, allowing exception-based toggling and single-request submission.              |  **P0**  | `AC-ATT-01`           | **Validated**  |
| **FR-ATT-004** | Attendance History & Audit   | Teachers can amend attendance within a 5-day window; subsequent amendments require Admin authorization and audit reason. |  **P0**  | `AC-ATT-02`           | **Validated**  |
| **FR-ATT-005** | Longitudinal Attendance Rate | Rolling 30-day and term attendance percentages automatically calculated, excluding excused absences from denominator.    |  **P0**  | `AC-FLG-01`           | **Validated**  |

---

## 5. Learning Resource Repository (RES)

| Identifier     | Requirement Name        | Description                                                                                                          | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-RES-001** | Resource Creation       | Teachers can publish learning resources associated with a specific Subject or Course Offering.                       |  **P0**  | `AC-RES-01`           | **Validated**  |
| **FR-RES-002** | Multi-Format Resources  | Resources support rich markdown text guides, external URLs, and uploaded document attachments (PDF, DOCX $\le 5$MB). |  **P0**  | `AC-RES-01`           | **Validated**  |
| **FR-RES-003** | Student Resource Access | Students can search, filter by subject, and download/read published resources for enrolled courses.                  |  **P0**  | `AC-RES-02`           | **Validated**  |
| **FR-RES-004** | Resource Status Toggles | Teachers can draft, publish, or archive learning resources to control visibility.                                    |  **P0**  | `AC-RES-01`           | **Validated**  |

---

## 6. Assignments, Submissions & Grading (ASN)

| Identifier     | Requirement Name         | Description                                                                                                   | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------ | :------: | :-------------------- | :------------: |
| **FR-ASN-001** | Assignment Publishing    | Teachers create coursework tasks with titles, rich instructions, max points, due dates, and attachments.      |  **P0**  | `AC-ASN-01`           | **Validated**  |
| **FR-ASN-002** | Digital Submission       | Enrolled students can submit assignments digitally via text entry or file upload before the deadline.         |  **P0**  | `AC-ASN-02`           | **Validated**  |
| **FR-ASN-003** | Late Submission Tracking | Submissions received after the deadline are automatically stamped with status `LATE` and timestamp logging.   |  **P0**  | `AC-ASN-02`           | **Validated**  |
| **FR-ASN-004** | Assignment Grading       | Teachers assign numerical points ($0 \le \text{Score} \le \text{Max Points}$) and publish grades to students. |  **P0**  | `AC-ASN-03`           | **Validated**  |
| **FR-ASN-005** | Structured Feedback      | Teachers attach constructive pedagogical feedback; mandatory for scores below 50%.                            |  **P0**  | `AC-ASN-03`           | **Validated**  |

---

## 7. Assessments & Examination Results (ASM)

| Identifier     | Requirement Name        | Description                                                                                     | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :---------------------- | :---------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-ASM-001** | Assessment Definition   | Define formal assessments with weight percentages (totaling 100%) and max marks.                |  **P0**  | `AC-ASM-01`           | **Validated**  |
| **FR-ASM-002** | Assessment Result Entry | Teachers record student scores, letter grades, and qualitative notes for scheduled assessments. |  **P0**  | `AC-ASM-01`           | **Validated**  |
| **FR-ASM-003** | Gradebook Overview      | Consolidated tabular gradebook view across all assessments with responsive card adaptations.    |  **P0**  | `AC-ASM-02`           | **Validated**  |

---

## 8. Student Progress, Support Flags & Intervention Plans (FLG / PLN)

| Identifier     | Requirement Name         | Description                                                                                                            | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-FLG-001** | Rule-Based Support Flags | Advisory Support Flags generated by objective triggers (attendance < 75%, 3 missing tasks, failing grade).             |  **P0**  | `AC-FLG-01`           | **Validated**  |
| **FR-FLG-002** | Transparent Explanation  | Every flag displays human-readable evidence citing exact dates, absences, and score baselines.                         |  **P0**  | `AC-FLG-01`           | **Validated**  |
| **FR-FLG-003** | Mandatory Human Review   | Flags require human teacher confirmation or dismissal with mandatory justification note before action.                 |  **P0**  | `AC-FLG-02/03`        | **Validated**  |
| **FR-PLN-001** | Support Plan Creation    | Teachers create formal Support Plans with lead educator, problem summary, and SMART recovery goals.                    |  **P0**  | `AC-PLN-01`           | **Validated**  |
| **FR-PLN-002** | Action Item Tracking     | Support Plans contain concrete, assignable action items with due dates and status toggles.                             |  **P0**  | `AC-PLN-01`           | **Validated**  |
| **FR-PLN-003** | Scheduled Review Cycle   | Mandatory review date ($\le 30$ days) where educator records milestone outcome (`RESOLVED`, `CONTINUED`, `ESCALATED`). |  **P0**  | `AC-PLN-02`           | **Validated**  |

---

## 9. Dashboards & System Auditing (DSH / AUD)

| Identifier     | Requirement Name         | Description                                                                                                    | Priority | Testable Criteria Ref | Phase 1 Status |
| :------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------: |
| **FR-DSH-001** | Role-Tailored Dashboards | Contextual home screens surfacing urgent priority action items (P95 latency $\le 200$ms).                      |  **P0**  | `AC-UI-01`            | **Validated**  |
| **FR-AUD-001** | Immutable Audit Trail    | Append-only audit record for authentication events, grade alterations, attendance overrides, and flag reviews. |  **P0**  | `AC-ATT-02`           | **Validated**  |
