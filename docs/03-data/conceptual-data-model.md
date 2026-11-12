# Conceptual Data Model

This document outlines the conceptual data model for the **FSD-SDG-4 Quality Education SaaS** platform, organizing the domain into cohesive entity clusters reflecting real-world institutional operations and the closed-loop student support lifecycle.

---

## 1. Domain Entity Clusters

The conceptual model is partitioned into seven interconnected domain clusters:

```text
                                [ 1. Tenancy & Identity ]
                                            │
                                            ▼
                               [ 2. Academic Hierarchy ]
                                            │
                                            ▼
                              [ 3. Rosters & Profiles ]
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
        [ 4. Daily Attendance ]                           [ 5. Coursework & Grading ]
                   │                                                 │
                   └────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                              [ 6. Support & Intervention ]
                                            │
                                            ▼
                                   [ 7. System Audit ]
```

---

## 2. Cluster Breakdown and Conceptual Entities

### Cluster 1: Tenancy and Identity

- **School**: The institutional tenant container. Owns all academic structures and student records.
- **User**: System user account with institutional email, Argon2id password hash, and assigned role.
- **Session**: Active server-managed login session mapped to a user, school tenant, and expiration timestamp.

### Cluster 2: Academic Hierarchy

- **AcademicYear**: School calendar year (e.g. 2026–2027) with start/end dates and status (`ACTIVE`, `ARCHIVED`).
- **Class**: Grade level (e.g., Grade 7, Grade 8, Form 1).
- **Section**: Specific classroom cohort within a Class (e.g., Section 8-A, Section 8-B).
- **Subject**: Academic discipline (e.g., Mathematics, General Science, English Literature).
- **CourseOffering**: Scheduled instance of a Subject taught to a Section during an Academic Year by assigned Teachers.

### Cluster 3: Rosters and Profiles

- **StudentProfile**: Demographic and institutional profile of an enrolled learner (student number, admission date).
- **TeacherProfile**: Professional profile of an educator (employee ID, specialization).
- **Enrollment**: Many-to-many relationship linking a Student to a Section for a specific Academic Year.
- **GuardianRelationship (P1)**: Links a Parent/Guardian account to one or more Students.

### Cluster 4: Daily Operations & Attendance

- **AttendanceRecord**: Daily attendance state (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) for a Student in a Section on a calendar date.
- **LearningResource**: Educational material (text guide, link, file) published for a Course Offering.

### Cluster 5: Coursework, Assessments & Grading

- **Assignment**: Homework, project, or exercise with instructions, due date, and maximum points.
- **AssignmentSubmission**: Student's submitted work (text entry, file attachment) with submission timestamp.
- **Assessment**: Formal examination or scheduled test (Midterm, Final) with institutional weighting.
- **AssessmentResult**: Numerical score and letter grade achieved by a student in an Assessment.
- **Feedback**: Constructive pedagogical comments attached to either an `AssignmentSubmission` or an `AssessmentResult` via explicit nullable composite foreign keys (`submission_id` or `assessment_result_id`, enforced mutually exclusive via `chk_feedbacks_single_parent`).

### Cluster 6: Support, Intervention & Progress (The Closed Loop)

- **ProgressSnapshot**: Aggregated attendance rate, coursework completion rate, and academic average for a student over a rolling period.
- **SupportFlag**: Objective, explainable early warning indicator (`ATTENDANCE_RISK`, `ACADEMIC_ENGAGEMENT_RISK`, `ACADEMIC_MASTERY_RISK`) with status (`PROPOSED`, `CONFIRMED`, `DISMISSED`).
- **SupportPlan**: Structured remedial intervention plan with problem definition, lead educator, and target SMART goals.
- **SupportPlanAction**: Discrete, assignable action items (e.g., peer tutoring, counselor meeting) with due dates and completion states.
- **SupportReview**: Scheduled milestone review evaluating student progress and recording plan outcome (`RESOLVED`, `CONTINUED`, `ESCALATED`).

### Cluster 7: System Audit

- **AuditLog**: Immutable append-only log capturing user mutations, sensitive state overrides, and access events.
