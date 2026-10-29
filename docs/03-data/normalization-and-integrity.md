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

### 3.1 Domain & Check Constraints
- **Attendance Status**: `CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'))`
- **Assessment Scores**: `CHECK (score >= 0.0 AND score <= max_marks)`
- **Academic Year Dates**: `CHECK (end_date > start_date)`
- **Review Date**: `CHECK (review_date >= created_at::DATE)`

### 3.2 Composite Uniqueness Constraints
- Prevent duplicate attendance for the same student on the same date:
  `UNIQUE (school_id, section_id, student_id, attendance_date)`
- Prevent duplicate enrollment for a student in an academic year:
  `UNIQUE (school_id, student_id, academic_year_id)`
- Prevent duplicate student ID numbers within a school:
  `UNIQUE (school_id, student_id_number)`
- Prevent duplicate course offerings in the same section:
  `UNIQUE (school_id, section_id, subject_id, academic_year_id)`
