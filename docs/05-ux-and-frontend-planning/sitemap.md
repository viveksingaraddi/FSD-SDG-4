# Role-Based Sitemap and Route Specification

This document defines the comprehensive, authoritative role-based sitemap, route paths, view titles, layout wrappers, and permission guards for the **FSD-SDG-4 Quality Education SaaS** frontend web application.

---

## 1. Global Routing Architecture & Conventions

### 1.1 URL Structure & Naming Rules

1. **Kebab-case Path Segments**: All URL path segments use lower-case kebab-case (e.g. `/course-offerings`, `/academic-years`).
2. **Dynamic Route Parameters**: Parametric segments use standard colon notation with descriptive nouns (e.g. `:sectionId`, `:offeringId`, `:studentId`, `:planId`).
3. **Role Namespace Enclosure**: Authenticated routes are strictly namespaced by role prefix (`/teacher/`, `/school/`, `/student/`, `/parent/`, `/admin/`), preventing route collisions and enabling clear layout boundary isolation.
4. **Tenant Context Resolution**: The active tenant (`school_id`) is resolved securely via authenticated server session cookie and subdomain context—**never** via mutable client route path parameters (e.g. no `/schools/:schoolId/classes` in tenant portals).
5. **Provisional Feature Tagging**: In compliance with Phase 1 governance decisions (specifically **OQ-002: Parent Portal Scope**), all parent portal routes are formally tagged as **`[PROVISIONAL - P1 SCOPE]`** pending school board ratification between Option A (full P1 release in Phase 14) and Option B (narrow P0 read-only view).

---

## 2. Route Inventory & Metadata Specification

The table below catalogs every frontend route, its unique identifier, required RBAC permissions, layout wrapper, and mobile bottom-nav inclusion:

| Route ID      | URL Path                                                | View Title                      | Layout Wrapper      | Required Role / Permission             | Mobile Bottom Nav |         Status         |
| :------------ | :------------------------------------------------------ | :------------------------------ | :------------------ | :------------------------------------- | :---------------: | :--------------------: |
| **RT-PUB-01** | `/login`                                                | Sign In                         | `AuthLayout`        | Public / Unauthenticated               |        No         |   Authoritative (P0)   |
| **RT-PUB-02** | `/forgot-password`                                      | Request Password Reset          | `AuthLayout`        | Public / Unauthenticated               |        No         |   Authoritative (P1)   |
| **RT-PUB-03** | `/reset-password`                                       | Set New Password                | `AuthLayout`        | Public / Reset Token Valid             |        No         |   Authoritative (P1)   |
| **RT-PUB-04** | `/403`                                                  | Access Forbidden                | `PublicLayout`      | Public / Authenticated                 |        No         |   Authoritative (P0)   |
| **RT-PUB-05** | `/404`                                                  | Page Not Found                  | `PublicLayout`      | Public / Any                           |        No         |   Authoritative (P0)   |
| **RT-PUB-06** | `/offline`                                              | Offline Workspace               | `PublicLayout`      | Any Authenticated                      |        No         |   Authoritative (P0)   |
| **RT-TCH-01** | `/teacher/dashboard`                                    | Educator Overview               | `TeacherLayout`     | `TEACHER` (`read:dashboard`)           | **Yes (Item 1)**  |   Authoritative (P0)   |
| **RT-TCH-02** | `/teacher/classes`                                      | My Assigned Classes             | `TeacherLayout`     | `TEACHER` (`read:sections`)            |        No         |   Authoritative (P0)   |
| **RT-TCH-03** | `/teacher/classes/:sectionId/attendance`                | Morning Attendance              | `TeacherLayout`     | `TEACHER` (`write:attendance`)         | **Yes (Item 2)**  |   Authoritative (P0)   |
| **RT-TCH-04** | `/teacher/classes/:sectionId/attendance/history`        | Attendance Audit Ledger         | `TeacherLayout`     | `TEACHER` (`read:attendance`)          |        No         |   Authoritative (P0)   |
| **RT-TCH-05** | `/teacher/classes/:sectionId/roster`                    | Section Student Roster          | `TeacherLayout`     | `TEACHER` (`read:students`)            |        No         |   Authoritative (P0)   |
| **RT-TCH-06** | `/teacher/course-offerings/:offeringId/resources`       | Course Resources Library        | `TeacherLayout`     | `TEACHER` (`manage:resources`)         |        No         |   Authoritative (P0)   |
| **RT-TCH-07** | `/teacher/course-offerings/:offeringId/assignments`     | Coursework List                 | `TeacherLayout`     | `TEACHER` (`read:assignments`)         | **Yes (Item 3)**  |   Authoritative (P0)   |
| **RT-TCH-08** | `/teacher/course-offerings/:offeringId/assignments/new` | Create Assignment               | `TeacherLayout`     | `TEACHER` (`write:assignments`)        |        No         |   Authoritative (P0)   |
| **RT-TCH-09** | `/teacher/assignments/:assignmentId/grading`            | Submission Grading Queue        | `TeacherLayout`     | `TEACHER` (`grade:assignments`)        |        No         |   Authoritative (P0)   |
| **RT-TCH-10** | `/teacher/course-offerings/:offeringId/gradebook`       | Consolidated Gradebook          | `TeacherLayout`     | `TEACHER` (`read:grades`)              |        No         |   Authoritative (P0)   |
| **RT-TCH-11** | `/teacher/students/:studentId`                          | Student Longitudinal Profile    | `TeacherLayout`     | `TEACHER` (`read:students`)            |        No         |   Authoritative (P0)   |
| **RT-TCH-12** | `/teacher/support/queue`                                | Support Flags Triage Queue      | `TeacherLayout`     | `TEACHER` (`triage:flags`)             | **Yes (Item 4)**  |   Authoritative (P0)   |
| **RT-TCH-13** | `/teacher/support/plans`                                | Active Support Plans            | `TeacherLayout`     | `TEACHER` (`read:plans`)               |        No         |   Authoritative (P0)   |
| **RT-TCH-14** | `/teacher/support/plans/new`                            | Draft Support Plan Wizard       | `TeacherLayout`     | `TEACHER` (`write:plans`)              |        No         |   Authoritative (P0)   |
| **RT-TCH-15** | `/teacher/support/plans/:planId`                        | Support Plan Case View          | `TeacherLayout`     | `TEACHER` (`manage:plans`)             |        No         |   Authoritative (P0)   |
| **RT-ADM-01** | `/school/dashboard`                                     | Institutional Overview          | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`read:admin_dash`)     | **Yes (Item 1)**  |   Authoritative (P0)   |
| **RT-ADM-02** | `/school/academic-years`                                | Academic Terms & Rollover       | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:terms`)        |        No         |   Authoritative (P0)   |
| **RT-ADM-03** | `/school/classes`                                       | Classes & Section Setup         | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:classes`)      | **Yes (Item 2)**  |   Authoritative (P0)   |
| **RT-ADM-04** | `/school/subjects`                                      | Curriculum Subject Catalog      | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:subjects`)     |        No         |   Authoritative (P0)   |
| **RT-ADM-05** | `/school/offerings`                                     | Course Offering Allocations     | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:offerings`)    |        No         |   Authoritative (P0)   |
| **RT-ADM-06** | `/school/staff`                                         | Staff Directory & Roles         | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:staff`)        | **Yes (Item 3)**  |   Authoritative (P0)   |
| **RT-ADM-07** | `/school/students`                                      | Student Directory & Intake      | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:students`)     | **Yes (Item 4)**  |   Authoritative (P0)   |
| **RT-ADM-08** | `/school/support-overview`                              | Pastoral Care Analytics         | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`read:school_support`) |        No         |   Authoritative (P0)   |
| **RT-ADM-09** | `/school/audit-log`                                     | Security & Mutation Audit       | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`read:audit_log`)      |        No         |   Authoritative (P0)   |
| **RT-ADM-10** | `/school/settings`                                      | School Profile & Branding       | `SchoolAdminLayout` | `SCHOOL_ADMIN` (`manage:settings`)     |        No         |   Authoritative (P0)   |
| **RT-STU-01** | `/student/dashboard`                                    | Student Learning Home           | `StudentLayout`     | `STUDENT` (`read:self_dash`)           | **Yes (Item 1)**  |   Authoritative (P0)   |
| **RT-STU-02** | `/student/courses`                                      | My Enrolled Subjects            | `StudentLayout`     | `STUDENT` (`read:self_courses`)        | **Yes (Item 2)**  |   Authoritative (P0)   |
| **RT-STU-03** | `/student/courses/:offeringId/resources`                | Course Study Materials          | `StudentLayout`     | `STUDENT` (`read:resources`)           |        No         |   Authoritative (P0)   |
| **RT-STU-04** | `/student/assignments`                                  | My Assignments & Tasks          | `StudentLayout`     | `STUDENT` (`read:self_assignments`)    | **Yes (Item 3)**  |   Authoritative (P0)   |
| **RT-STU-05** | `/student/assignments/:assignmentId/submit`             | Submit Assignment Work          | `StudentLayout`     | `STUDENT` (`submit:assignments`)       |        No         |   Authoritative (P0)   |
| **RT-STU-06** | `/student/progress`                                     | My Progress & Goals             | `StudentLayout`     | `STUDENT` (`read:self_progress`)       | **Yes (Item 4)**  |   Authoritative (P0)   |
| **RT-PAR-01** | `/parent/dashboard`                                     | Family Portal Overview          | `ParentLayout`      | `PARENT` (`read:family_dash`)          | **Yes (Item 1)**  | _Provisional (OQ-002)_ |
| **RT-PAR-02** | `/parent/children/:studentId/attendance`                | Child Attendance Ledger         | `ParentLayout`      | `PARENT` (`read:child_attendance`)     | **Yes (Item 2)**  | _Provisional (OQ-002)_ |
| **RT-PAR-03** | `/parent/children/:studentId/grades`                    | Child Academic Report           | `ParentLayout`      | `PARENT` (`read:child_grades`)         | **Yes (Item 3)**  | _Provisional (OQ-002)_ |
| **RT-PAR-04** | `/parent/children/:studentId/support-goals`             | Home Learning Support           | `ParentLayout`      | `PARENT` (`read:child_support`)        | **Yes (Item 4)**  | _Provisional (OQ-002)_ |
| **RT-SUP-01** | `/admin/dashboard`                                      | Platform Operations Center      | `SuperAdminLayout`  | `SUPER_ADMIN` (`read:platform_kpis`)   | **Yes (Item 1)**  |   Authoritative (P0)   |
| **RT-SUP-02** | `/admin/schools`                                        | Tenant Directory & Provisioning | `SuperAdminLayout`  | `SUPER_ADMIN` (`manage:tenants`)       | **Yes (Item 2)**  |   Authoritative (P0)   |
| **RT-SUP-03** | `/admin/schools/:schoolId`                              | Tenant Inspection & Config      | `SuperAdminLayout`  | `SUPER_ADMIN` (`inspect:tenant`)       |        No         |   Authoritative (P0)   |
| **RT-SUP-04** | `/admin/system-logs`                                    | Platform Security Stream        | `SuperAdminLayout`  | `SUPER_ADMIN` (`read:platform_logs`)   | **Yes (Item 3)**  |   Authoritative (P0)   |

---

## 3. Query Parameter Specifications for High-Frequency Routes

To ensure predictable filtering, bookmarking, and zero layout flicker, the following query parameters are standardized:

### 3.1 Morning Attendance Grid (`/teacher/classes/:sectionId/attendance`)

- `?date=YYYY-MM-DD`: Selected attendance date (defaults to current server date in school timezone).
- `?filter=all|unmarked|absent|late`: Filter roster by status chips for rapid audit.
- `?mode=grid|list`: View mode toggle (grid cards on mobile, tabular list on desktop).

### 3.2 Assignment Grading Queue (`/teacher/assignments/:assignmentId/grading`)

- `?status=all|submitted|graded|missing|late`: Submission status filter.
- `?drawer=:submissionId`: Controls the active deep-linked grading drawer without losing table scroll position.
- `?sort=name_asc|submitted_desc|score_asc`: Sorting column and order.

### 3.3 Early Warning Support Queue (`/teacher/support/queue`)

- `?tier=all|tier_1|tier_2|tier_3`: Urgency filter based on student support tier.
- `?category=all|attendance|academic|behavioral`: Originating indicator filter.
- `?sectionId=:sectionId`: Filter flags by assigned class section.

### 3.4 Student Directory (`/school/students`)

- `?sectionId=:sectionId`: Filter by enrolled class section.
- `?status=ACTIVE|INACTIVE|TRANSFERRED`: Student enrollment status.
- `?page=1&limit=25`: Standard pagination parameters.
- `?search=:queryString`: Substring query matching student name or student ID.
