# Indexing and Query Performance Strategy

This document specifies the database indexing standards, composite multi-tenant index patterns, high-frequency query optimizations, and query plan guidelines for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Multi-Tenant Indexing Principle: `school_id` as Leading Column

In a shared-database, shared-schema architecture, queries almost universally filter by the authenticated tenant. Therefore, **composite B-Tree indexes must feature `school_id` as the leading column**:

$$\text{INDEX}\ (\mathbf{school\_id},\ \text{secondary\_filter},\ \text{sort\_column})$$

This ensures that the PostgreSQL query planner immediately prunes index scans to the current tenant's data slice before evaluating additional filters.

---

## 2. High-Frequency Query Profiles & Index Catalog

### 2.1 Daily Morning Attendance Recording

- **Query Pattern**: Teacher fetches the full section roster for today's date:  
  `SELECT * FROM attendance_records WHERE school_id = $1 AND section_id = $2 AND attendance_date = $3;`
- **Target Index**:  
  `CREATE INDEX idx_attendance_lookup ON attendance_records (school_id, section_id, attendance_date);`

### 2.2 Student Support Flag Queue

- **Query Pattern**: Teacher or counselor views active unreviewed flags:  
  `SELECT * FROM support_flags WHERE school_id = $1 AND status = 'PROPOSED' ORDER BY created_at DESC;`
- **Target Partial Index**:  
  `CREATE INDEX idx_support_flags_pending ON support_flags (school_id, created_at DESC) WHERE status = 'PROPOSED';`
  _(Note: A partial index avoids indexing thousands of resolved or historical flags, keeping the index cache compact)._

### 2.3 Longitudinal Student Progress Synthesis

- **Query Pattern**: Fetch student's attendance history over the past 30 days:  
  `SELECT status, count(*) FROM attendance_records WHERE school_id = $1 AND student_id = $2 AND attendance_date >= $3 GROUP BY status;`
- **Target Index**:  
  `CREATE INDEX idx_attendance_student_history ON attendance_records (school_id, student_id, attendance_date);`

### 2.4 Gradebook Assessment Overview

- **Query Pattern**: Teacher loads all assessment results for a course offering:  
  `SELECT * FROM assessment_results ar JOIN assessments a ON ar.assessment_id = a.id WHERE a.school_id = $1 AND a.course_offering_id = $2;`
- **Target Index**:  
  `CREATE INDEX idx_assessments_course ON assessments (school_id, course_offering_id);`  
  `CREATE INDEX idx_assessment_results_assessment ON assessment_results (school_id, assessment_id);`

### 2.5 Foreign Key Indexing Mandate

- In PostgreSQL, foreign keys do NOT create indexes on the referencing table automatically. To prevent catastrophic sequential table scans during cascading deletes or joins, **all foreign key columns must have an explicit B-Tree index**.

---

## 3. Query Performance Budgets & Execution Plans

- **Query Execution Timeout**: Server sets `statement_timeout = '5000ms'` to abort pathological queries before consuming database thread pools.
- **Explain Analyze Verification**: During Phase 5 schema development, all queries supporting core workflows must undergo `EXPLAIN (ANALYZE, BUFFERS)` inspection to verify index scans (`Index Scan` or `Bitmap Index Scan`) with zero `Seq Scan` on tables with $> 1,000$ rows.
