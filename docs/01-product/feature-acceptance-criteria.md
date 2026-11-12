# Feature Acceptance Criteria (Gherkin Scenarios)

This document establishes the authoritative, testable acceptance criteria for the core features of the **FSD-SDG-4 Quality Education SaaS** platform using the Gherkin specification language (`Given / When / Then`).

> **NOTE ON NUMERICAL VALUES**:  
> Specific operational thresholds (e.g. attendance below 75%, 5-day amendment window, 60-minute session idle timeout) are documented as **proposed baseline values** subject to institutional policy configuration during Phase 1 sign-off.

---

## 1. Authentication, Sessions & Tenant Boundary Scenarios

### Scenario AC-AUTH-01: Successful Sign-In with Secure Session Cookie

- **Given** an active user exists with email `"teacher@school1.test"` and password `"ValidSecret123!"` belonging to School Tenant `"sch_01"`
- **When** the user sends a `POST /api/v1/auth/login` request with valid credentials
- **Then** the server returns HTTP `200 OK` with user profile data `{ id, email, role: "TEACHER", schoolId: "sch_01" }`
- **And** the response includes a `Set-Cookie` header containing `sid=<token>; HttpOnly; Secure; SameSite=Lax; Path=/`
- **And** a new active session record is persisted in the database with an expiration timestamp 8 hours in the future.

### Scenario AC-AUTH-02: Unsuccessful Sign-In (Invalid Password)

- **Given** an active user exists with email `"teacher@school1.test"`
- **When** a user submits `POST /api/v1/auth/login` with an incorrect password
- **Then** the server returns HTTP `401 Unauthorized` with an RFC 7807 problem details envelope (`ERR_AUTH_CREDENTIALS_INVALID`)
- **And** no session cookie is set
- **And** the failed attempt is recorded against the IP and account rate limiter.

### Scenario AC-AUTH-03: Brute-Force Rate Limiting Lockout

- **Given** an attacker submits 5 consecutive failed login requests within a 15-minute window for `"admin@school1.test"`
- **When** the attacker submits a 6th login request
- **Then** the server returns HTTP `429 Too Many Requests` with header `Retry-After: 900`
- **And** the request is rejected immediately without executing the Argon2id password hash function.

### Scenario AC-AUTH-04: Unauthorized Role Access (Student accessing Admin Route)

- **Given** a student is authenticated with role `"STUDENT"` and valid session cookie
- **When** the student attempts to access `GET /api/v1/schools/settings` or `POST /api/v1/classes`
- **Then** the server returns HTTP `403 Forbidden` with error code `ERR_FORBIDDEN_ROLE`
- **And** the unauthorized access attempt is recorded in the security audit stream.

### Scenario AC-AUTH-05: Cross-School Data Access Attempt (Tenant Isolation Defense)

- **Given** Teacher A is authenticated with verified session in School Tenant `"sch_alpha"`
- **When** Teacher A executes `GET /api/v1/attendance/sections/sec_beta_8B` (belonging to School Tenant `"sch_beta"`)
- **Then** the server returns HTTP `404 Not Found` (`ERR_RESOURCE_NOT_FOUND`)
- **And** zero student records or names from `"sch_beta"` are disclosed in the response payload
- **And** an internal security audit event logs a potential cross-tenant IDOR probe with correlation ID.

---

## 2. School Setup and Enrollment Scenarios

### Scenario AC-SCH-01: Academic Year Initialization and Status Transition

- **Given** a School Administrator is authenticated in `"sch_alpha"`
- **When** the administrator submits `POST /api/v1/academic-years` with name `"2026-2027"`, start date `"2026-09-01"`, and end date `"2027-06-30"`
- **Then** the server creates the academic year with status `"PLANNED"`
- **When** the administrator transitions the year to `"ACTIVE"` via `PATCH /api/v1/academic-years/:id/status`
- **Then** any previously active academic year transitions to `"ARCHIVED"`
- **And** the database enforces that exactly one academic year is `"ACTIVE"`.

### Scenario AC-USR-01: Student Roster Enrollment in Active Section

- **Given** an active Class Section `"Grade 8-A"` exists under the active academic year
- **And** unassigned Student `"stu_101"` exists within the same school tenant
- **When** the School Administrator submits `POST /api/v1/sections/sec_8A/enrollments` with student ID `"stu_101"`
- **Then** the server returns HTTP `201 Created`
- **And** a new `Enrollment` record links `"stu_101"` to `"sec_8A"` with status `"ACTIVE"`
- **When** the administrator attempts to enroll the same student into `"sec_8A"` again
- **Then** the server returns HTTP `409 Conflict` enforcing the unique constraint `(school_id, student_id, academic_year_id)`.

---

## 3. Daily Attendance Recording and Correction Scenarios

### Scenario AC-ATT-01: Fast Morning Section Attendance Submission

- **Given** a Teacher is assigned to Section `"8-A"` containing 30 enrolled students
- **When** the teacher requests `GET /api/v1/attendance/sections/sec_8A?date=2026-10-29`
- **Then** the roster loads with all 30 students defaulted to status `"PRESENT"`
- **When** the teacher toggles Student 4 to `"ABSENT"` and Student 12 to `"LATE"` with remark `"Bus delayed"`
- **And** submits `POST /api/v1/attendance/sections/sec_8A`
- **Then** the server persists all 30 records in a single database transaction in under $250\text{ ms}$
- **And** returns HTTP `200 OK` with counts `{ total: 30, present: 28, absent: 1, late: 1, excused: 0 }`.

### Scenario AC-ATT-02: Attendance Record Amendment within 5-Day Window

- **Given** an attendance record exists for Student 4 marked `"ABSENT"` dated 2 days ago
- **When** the assigned Teacher updates the record via `PATCH /api/v1/attendance/records/rec_04` to status `"EXCUSED"` with remark `"Medical note provided"`
- **Then** the server updates the status and writes an entry to `audit_logs` capturing `{ actorId, beforeStatus: "ABSENT", afterStatus: "EXCUSED", remarks }`.

### Scenario AC-ATT-03: Attendance Amendment Rejected Post-Lockout Window

- **Given** an attendance record exists dated 14 days in the past
- **When** a Teacher attempts to update the record via `PATCH /api/v1/attendance/records/:id`
- **Then** the server returns HTTP `403 Forbidden` with detail `"Attendance records older than 5 days can only be modified by a School Administrator"`
- **And** the original record remains unchanged.

---

## 4. Coursework, Assignments, Grading and Feedback Scenarios

### Scenario AC-ASN-01: Assignment Publishing

- **Given** a Teacher is assigned to Course Offering `"Grade 8 Math"`
- **When** the teacher submits `POST /api/v1/course-offerings/co_math/assignments` with title `"Fractions Quiz"`, max points `50`, and due date 7 days in the future
- **Then** the server returns HTTP `201 Created`
- **And** the assignment appears on the dashboard of all students enrolled in the corresponding section.

### Scenario AC-ASN-02: Student Submission and Late Enforcement

- **Given** an active assignment has a due date of `"2026-10-28T17:00:00Z"`
- **When** an enrolled Student submits coursework at `"2026-10-28T16:45:00Z"`
- **Then** the submission is accepted with status `"SUBMITTED"` and `isLate: false`
- **When** another Student submits coursework at `"2026-10-28T18:15:00Z"`
- **Then** the submission is accepted with status `"LATE"` and `isLate: true`, logging the exact timestamp.

### Scenario AC-ASN-03: Grading and Constructive Pedagogical Feedback

- **Given** a submitted assignment exists in the teacher's grading queue
- **When** the Teacher posts grade data `{ score: 22, maxPoints: 50, feedback: "Review common denominator rules for questions 3 and 4" }`
- **Then** the server validates that $0 \le 22 \le 50$
- **And** persists the score and feedback
- **And** because score $< 50\%$, verifies that the feedback text is non-empty before permitting publication.

---

## 5. Formal Assessments and Consolidated Gradebook Scenarios

### Scenario AC-ASM-01: Assessment Creation and Weight Validation

- **Given** Course Offering `"Grade 8 Science"` has existing assessments totaling `60%` weight
- **When** a Teacher creates a Final Exam with weight `50%` (bringing total to `110%`)
- **Then** the server returns HTTP `422 Unprocessable Entity` with validation detail `"Total assessment weights for course offering cannot exceed 100%"`
- **When** the teacher sets weight to `40%` (total `100%`)
- **Then** the assessment is successfully scheduled.

### Scenario AC-ASM-02: Section Gradebook Retrieval

- **Given** Section `"8-A"` has 30 students and 5 scheduled assessments
- **When** the Teacher requests `GET /api/v1/sections/sec_8A/gradebook`
- **Then** the server returns a consolidated matrix containing all students, individual scores, letter grades, and cumulative weighted averages in $\le 600\text{ ms}$ at P95.

---

## 6. Student Progress, Support Flags and Intervention Plans Scenarios

### Scenario AC-FLG-01: Rule-Based Attendance Risk Flag Trigger

- **Given** Student Amina has accumulated 4 unexcused absences in the past 30 days (attendance rate $68\% \le 75\%$ proposed threshold)
- **When** the progress calculation job evaluates Amina's profile
- **Then** a new `SupportFlag` record is generated with:
  - `status: "PROPOSED"`
  - `flagType: "ATTENDANCE_RISK"`
  - `severity: "MEDIUM"`
  - `rationale: "Attendance rate 68% over past 30 days (4 unexcused absences)"`
- **And** the flag appears in the teacher's unreviewed flags queue.

### Scenario AC-FLG-02: Mandatory Human Review (Confirmation)

- **Given** a `PROPOSED` Support Flag exists for Student Amina
- **When** the Teacher clicks _"Confirm Flag"_ via `POST /api/v1/support/flags/:id/confirm`
- **Then** the flag transitions to status `"CONFIRMED"`
- **And** the UI prompts the teacher to create a structured Support Plan.

### Scenario AC-FLG-03: Mandatory Human Review (Dismissal with Justification)

- **Given** a `PROPOSED` Support Flag exists for Student Dev
- **When** the Teacher submits `POST /api/v1/support/flags/:id/dismiss` with empty justification
- **Then** the server returns HTTP `422 Unprocessable Entity` requiring `"Justification text is mandatory when dismissing a support flag"`
- **When** the teacher provides justification `"Student was hospitalized with documented medical excuse"`
- **Then** the flag transitions to status `"DISMISSED"`
- **And** the justification is archived in the audit record, preventing the flag from appearing as active.

### Scenario AC-PLN-01: Support Plan Creation and Action Item Checklist

- **Given** a confirmed Support Flag for Student Amina
- **When** the Lead Teacher submits `POST /api/v1/support/plans` with:
  - `leadTeacherId: "usr_daniel"`
  - `targetGoal: "Achieve >= 90% attendance over next 3 weeks"`
  - `reviewDate: "2026-11-21"` (23 days in future $\le 30$ days)
  - `actions: [{ description: "Guardian phone check-in", dueDate: "2026-10-31" }]`
- **Then** the Support Plan is created with status `"ACTIVE"`
- **And** linked action items are created with status `"PENDING"`.

### Scenario AC-PLN-02: Milestone Review and Case Resolution

- **Given** an active Support Plan reaches its scheduled review date
- **When** the Lead Teacher evaluates progress, verifies attendance recovered to $92\%$, and submits `POST /api/v1/support/plans/:id/reviews` with `outcomeStatus: "RESOLVED"` and review notes
- **Then** the Support Plan transitions to status `"RESOLVED"`
- **And** the closed intervention case is archived, with positive growth reflected on the student's progress view.

---

## 7. UI States, Accessibility and Shared-Device Scenarios

### Scenario AC-UI-01: Empty State Display

- **Given** a Teacher logs in on the first day of the academic term before any assignments or support flags exist
- **When** the teacher navigates to `/teacher/support/queue`
- **Then** the view displays an accessible `EmptyState` component with illustration, clear copy (_"All students are currently on track — No active support flags"_), and zero broken table skeletons.

### Scenario AC-UI-02: Keyboard Navigation & Focus Trap in Modals

- **Given** an educator opens the _"Flag Review Modal"_ via keyboard `Enter`
- **When** the modal renders
- **Then** focus is automatically moved to the first interactive element inside the modal
- **And** pressing `Tab` cycles focus strictly within the modal elements (focus trap)
- **And** pressing `Escape` closes the modal and returns focus to the triggering button.

### Scenario AC-UI-03: Shared-Device Session Destruction on Logout

- **Given** a student is logged into a shared school computer terminal
- **When** the student clicks the prominent _"Sign Out"_ button in the header
- **Then** the browser sends `POST /api/v1/auth/logout`
- **And** the server deletes the session row from PostgreSQL
- **And** the response clears the `sid` cookie (`Max-Age=0`)
- **And** the client clears TanStack Query in-memory cache
- **When** the user clicks the browser "Back" button
- **Then** the browser redirects to `/login` without revealing any student records or cached grades.
