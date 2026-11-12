# Normalization and Relational Integrity

This document defines the relational normalization standard, constraint architecture, and integrity enforcement mechanisms for the **FSD-SDG-4 Quality Education SaaS** database.

---

## 1. Normalization Baseline (Third Normal Form - 3NF)

All transactional operational tables are normalized to **Third Normal Form (3NF)**:

1. **First Normal Form (1NF)**: All columns contain atomic, indivisible values. Repeating groups and comma-delimited strings are prohibited.
2. **Second Normal Form (2NF)**: All non-key attributes are fully functionally dependent on the entire primary key, eliminating partial key dependencies in composite-key entities.
3. **Third Normal Form (3NF)**: No transitive dependencies exist between non-key attributes. For example, student grade level is not duplicated on `AttendanceRecord`; it is resolved through `Section` $\to$ `Class`.

---

## 2. Controlled Denormalization & Read Caching

To ensure high performance under real-world school operations, controlled denormalization is restricted to **isolated snapshot and aggregation tables**:

- **`progress_snapshots` Table**: Pre-aggregates rolling 30-day attendance rates and cumulative assessment averages for each student. Rather than computing expensive multi-table joins on every student dashboard load, the snapshot is calculated asynchronously (e.g., nightly or on grade submission) and stored as a point-in-time record.
- **Tenant ID Replication**: Even though child entities (e.g. `AttendanceRecord`) are linked to parent `Section` which is linked to `School`, `school_id` is explicitly duplicated on all child tables. This enables direct, single-level multi-tenant indexing without requiring expensive relational joins to verify tenant boundaries.

---

## 3. Database Integrity Constraints

### 3.1 Domain & Check Constraints (Implemented in `20261112065114_init`)

- **Attendance Status**: Enforced via PostgreSQL `AttendanceStatus` enum (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) + `chk_attendance_late_minutes_positive`.
- **Assessment & Assignment Scores**: `chk_assignments_max_points_positive`, `chk_submissions_score_non_negative`, `chk_assessments_bounds`, `chk_assessment_results_score_non_negative`.
- **Academic Year Dates & Single Active Term**: `chk_academic_years_dates` (`end_date > start_date`) + partial unique index `uq_academic_years_one_active_per_school`.
- **User Role vs Tenant Boundary**: `chk_users_role_school_id` (`SUPER_ADMIN` has `school_id IS NULL`; all school roles have `school_id IS NOT NULL`).
- **Feedback Single-Parent Constraint**: `chk_feedbacks_single_parent` (XOR between `submission_id` and `assessment_result_id`).
- **Support Flag Dismissal Justification**: `chk_support_flags_dismissal_reason` (`char_length(btrim(dismissal_reason)) >= 10` when `DISMISSED`).

### 3.2 Composite Uniqueness Constraints

- Prevent duplicate attendance for the same student on the same date:
  `UNIQUE (school_id, section_id, student_id, attendance_date)`
- Prevent duplicate enrollment for a student in an academic year:
  `UNIQUE (school_id, student_id, academic_year_id)`
- Prevent duplicate student ID numbers within a school:
  `UNIQUE (school_id, student_id_number)`
- Prevent duplicate course offerings in the same section:
  `UNIQUE (school_id, section_id, subject_id, academic_year_id)`
