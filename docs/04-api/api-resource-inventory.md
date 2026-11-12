# API Resource Inventory Catalog

This catalog enumerates the authoritative REST API resources, methods, route paths, RBAC restrictions, and descriptions for the **FSD-SDG-4 Quality Education SaaS** `/api/v1` namespace.

---

## 1. Authentication & Session Endpoints (`/api/v1/auth`)

| HTTP Method | Route Path                            | Authorized Roles | Description & Functionality                                     |
| :---------- | :------------------------------------ | :--------------- | :-------------------------------------------------------------- |
| `POST`      | `/api/v1/auth/login`                  | Public           | Authenticates credentials; sets secure `sid` session cookie.    |
| `POST`      | `/api/v1/auth/logout`                 | Authenticated    | Destroys server session in DB; clears client session cookie.    |
| `GET`       | `/api/v1/auth/me`                     | Authenticated    | Returns currently authenticated user profile, school, and role. |
| `POST`      | `/api/v1/auth/password-reset/request` | Public (P1)      | Initiates out-of-band password reset token dispatch.            |
| `POST`      | `/api/v1/auth/password-reset/confirm` | Public (P1)      | Consumes reset token and sets new Argon2id password hash.       |

---

## 2. School Setup & Academic Structure (`/api/v1/schools`, `/api/v1/academic-years`)

| HTTP Method | Route Path                          | Authorized Roles | Description & Functionality                                     |
| :---------- | :---------------------------------- | :--------------- | :-------------------------------------------------------------- |
| `POST`      | `/api/v1/admin/schools`             | `SUPER_ADMIN`    | Registers a new institutional school tenant.                    |
| `GET`       | `/api/v1/schools/settings`          | `SCHOOL_ADMIN`   | Retrieves active tenant profile, branding, and status.          |
| `PATCH`     | `/api/v1/schools/settings`          | `SCHOOL_ADMIN`   | Updates tenant configuration and contact parameters.            |
| `GET`       | `/api/v1/academic-years`            | Staff, Students  | Lists all academic terms configured for the tenant.             |
| `POST`      | `/api/v1/academic-years`            | `SCHOOL_ADMIN`   | Creates a new academic year with date boundaries.               |
| `PATCH`     | `/api/v1/academic-years/:id/status` | `SCHOOL_ADMIN`   | Transitions term status (`ACTIVE`, `COMPLETED`, `ARCHIVED`).    |
| `GET`       | `/api/v1/classes`                   | Staff, Students  | Lists grade levels and their associated sections.               |
| `POST`      | `/api/v1/classes`                   | `SCHOOL_ADMIN`   | Creates a new grade level and sections.                         |
| `GET`       | `/api/v1/subjects`                  | Staff, Students  | Lists curriculum subjects registered in the school.             |
| `POST`      | `/api/v1/subjects`                  | `SCHOOL_ADMIN`   | Adds a new subject to the school curriculum catalog.            |
| `GET`       | `/api/v1/course-offerings`          | Staff, Students  | Lists scheduled courses for active sections.                    |
| `POST`      | `/api/v1/course-offerings`          | `SCHOOL_ADMIN`   | Creates course offering linking subject, section, and teachers. |

---

## 3. Users, Profiles & Rosters (`/api/v1/users`, `/api/v1/rosters`)

| HTTP Method | Route Path                                | Authorized Roles | Description & Functionality                              |
| :---------- | :---------------------------------------- | :--------------- | :------------------------------------------------------- |
| `GET`       | `/api/v1/users`                           | `SCHOOL_ADMIN`   | Lists staff and student accounts with filtering by role. |
| `POST`      | `/api/v1/users/teachers`                  | `SCHOOL_ADMIN`   | Provisions a new teacher account and employee profile.   |
| `POST`      | `/api/v1/users/students`                  | `SCHOOL_ADMIN`   | Provisions a new student account and academic profile.   |
| `GET`       | `/api/v1/sections/:sectionId/roster`      | Teachers, Admin  | Retrieves enrolled student list for a class section.     |
| `POST`      | `/api/v1/sections/:sectionId/enrollments` | `SCHOOL_ADMIN`   | Enrolls students into a class section roster.            |
| `DELETE`    | `/api/v1/enrollments/:enrollmentId`       | `SCHOOL_ADMIN`   | Drops or transfers a student enrollment.                 |

---

## 4. Attendance Management (`/api/v1/attendance`)

| HTTP Method | Route Path                               | Authorized Roles      | Description & Functionality                                         |
| :---------- | :--------------------------------------- | :-------------------- | :------------------------------------------------------------------ |
| `GET`       | `/api/v1/attendance/sections/:sectionId` | Teachers, Admin       | Loads daily attendance roster for section and specific date.        |
| `POST`      | `/api/v1/attendance/sections/:sectionId` | `TEACHER`, Admin      | Bulk submits or updates daily attendance for entire section roster. |
| `GET`       | `/api/v1/attendance/students/:studentId` | Teachers, Admin, Self | Retrieves longitudinal attendance history and rate for a student.   |
| `PATCH`     | `/api/v1/attendance/records/:recordId`   | Teachers, Admin       | Amends a past attendance record (subject to 5-day lock window).     |

---

## 5. Coursework, Learning Resources & Assignments (`/api/v1/coursework`)

| HTTP Method | Route Path                                 | Authorized Roles | Description & Functionality                                   |
| :---------- | :----------------------------------------- | :--------------- | :------------------------------------------------------------ |
| `GET`       | `/api/v1/course-offerings/:id/resources`   | Enrolled Users   | Lists published learning guides, links, and documents.        |
| `POST`      | `/api/v1/course-offerings/:id/resources`   | `TEACHER`        | Publishes a new learning resource or reading guide.           |
| `GET`       | `/api/v1/course-offerings/:id/assignments` | Enrolled Users   | Lists active and past assignments with due dates.             |
| `POST`      | `/api/v1/course-offerings/:id/assignments` | `TEACHER`        | Publishes a new coursework assignment with instructions.      |
| `GET`       | `/api/v1/assignments/:id/submissions`      | `TEACHER`        | Grading queue: lists all student submissions and status.      |
| `POST`      | `/api/v1/assignments/:id/submissions`      | `STUDENT`        | Submits coursework digital entry or file attachment.          |
| `POST`      | `/api/v1/submissions/:id/grade`            | `TEACHER`        | Records numerical score and qualitative pedagogical feedback. |

---

## 6. Assessments & Gradebook (`/api/v1/assessments`)

| HTTP Method | Route Path                                 | Authorized Roles | Description & Functionality                                       |
| :---------- | :----------------------------------------- | :--------------- | :---------------------------------------------------------------- |
| `GET`       | `/api/v1/course-offerings/:id/assessments` | Enrolled Users   | Lists scheduled unit tests, midterms, and final exams.            |
| `POST`      | `/api/v1/course-offerings/:id/assessments` | `TEACHER`, Admin | Schedules a formal assessment with weight percentage.             |
| `POST`      | `/api/v1/assessments/:id/results`          | `TEACHER`        | Enters scores and letter grades for assessed students.            |
| `GET`       | `/api/v1/sections/:sectionId/gradebook`    | Teachers, Admin  | Consolidates section-wide gradebook table across all assessments. |

---

## 7. Support Flags, Interventions & Reviews (`/api/v1/support`)

| HTTP Method | Route Path                              | Authorized Roles | Description & Functionality                                             |
| :---------- | :-------------------------------------- | :--------------- | :---------------------------------------------------------------------- |
| `GET`       | `/api/v1/support/flags`                 | Teachers, Admin  | Retrieves unreviewed `PROPOSED` student support flags queue.            |
| `POST`      | `/api/v1/support/flags/:flagId/confirm` | Teachers, Admin  | Validates an advisory flag; prompts Support Plan drafting.              |
| `POST`      | `/api/v1/support/flags/:flagId/dismiss` | Teachers, Admin  | Dismisses flag with mandatory human justification text.                 |
| `GET`       | `/api/v1/support/plans`                 | Teachers, Admin  | Lists active and historical student intervention plans.                 |
| `POST`      | `/api/v1/support/plans`                 | Teachers, Admin  | Drafts a Support Plan with lead educator and SMART goals.               |
| `POST`      | `/api/v1/support/plans/:id/actions`     | Teachers, Admin  | Adds assignable action item to a support plan.                          |
| `PATCH`     | `/api/v1/support/actions/:actionId`     | Assigned Users   | Updates action item status (`IN_PROGRESS`, `COMPLETED`).                |
| `POST`      | `/api/v1/support/plans/:id/reviews`     | Teachers, Admin  | Records formal review milestone (`RESOLVED`, `CONTINUED`, `ESCALATED`). |

---

## 8. Audit & Compliance (`/api/v1/audit`)

| HTTP Method | Route Path           | Authorized Roles              | Description & Functionality                                  |
| :---------- | :------------------- | :---------------------------- | :----------------------------------------------------------- |
| `GET`       | `/api/v1/audit/logs` | `SCHOOL_ADMIN`, `SUPER_ADMIN` | Queries immutable tenant audit log with entity/date filters. |
