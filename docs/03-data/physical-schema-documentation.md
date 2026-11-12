# Physical Schema Documentation (Phase 5)

**Database Engine**: PostgreSQL `16.15`  
**ORM / Migration Tool**: Prisma `6.19.3` (`@prisma/client@6.19.3`)  
**Schema Source**: [`apps/api/prisma/schema.prisma`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/schema.prisma)  
**Initial Migration**: [`apps/api/prisma/migrations/20261112065114_init/migration.sql`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/migrations/20261112065114_init/migration.sql)

---

## 1. Entity Validation & Consolidation Decisions

From the 25 candidate entities in the Phase 5 specification and 26 conceptual entities in Phase 0:

1. **`Role` & `Permission` Consolidated into `UserRole` Enum**:
   - The approved product scope defines 5 fixed roles (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) with no custom role-builder UI in P0/P1. Modeling `UserRole` as a PostgreSQL enum avoids unnecessary join overhead while remaining extensible via future migrations if custom RBAC is ever introduced.
2. **`Session`, `CourseOffering`, and `CourseTeacher` Retained**:
   - `Session` supports server-managed cookie authentication (Phase 7).
   - `CourseOffering` and `CourseTeacher` satisfy **BR-SCH-003** (linking `AcademicYear`, `Section`, `Subject`, and `PRIMARY`/`ASSISTANT` teachers).
3. **`Feedback` Polymorphism Eliminated**:
   - Instead of a polymorphic `(entity_type, entity_id)` pair without FK enforcement, `feedbacks` uses two explicit nullable composite foreign keys (`submission_id`, `assessment_result_id`) guarded by `chk_feedbacks_single_parent` so exactly one parent is non-null.

---

## 2. Physical Model Summary (26 Models, 14 Enums)

| Cluster                     | Models (Table Names)                                                                                                                                                                           |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Tenancy & Identity**   | `School` (`schools`), `User` (`users`), `Session` (`sessions`)                                                                                                                                 |
| **2. Academic Hierarchy**   | `AcademicYear` (`academic_years`), `Class` (`classes`), `Section` (`sections`), `Subject` (`subjects`), `CourseOffering` (`course_offerings`), `CourseTeacher` (`course_teachers`)             |
| **3. Rosters & Profiles**   | `TeacherProfile` (`teacher_profiles`), `StudentProfile` (`student_profiles`), `Enrollment` (`enrollments`), `GuardianRelationship` (`guardian_relationships`)                                  |
| **4. Daily Operations**     | `AttendanceRecord` (`attendance_records`), `LearningResource` (`learning_resources`)                                                                                                           |
| **5. Coursework & Grading** | `Assignment` (`assignments`), `AssignmentSubmission` (`assignment_submissions`), `Assessment` (`assessments`), `AssessmentResult` (`assessment_results`), `Feedback` (`feedbacks`)             |
| **6. Support & Progress**   | `ProgressSnapshot` (`progress_snapshots`), `SupportPlan` (`support_plans`), `SupportFlag` (`support_flags`), `SupportPlanAction` (`support_plan_actions`), `SupportReview` (`support_reviews`) |
| **7. System Audit**         | `AuditLog` (`audit_logs`)                                                                                                                                                                      |

---

## 3. PostgreSQL-Native Constraints & Partial Indexes

Appended to [`migration.sql`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/migrations/20261112065114_init/migration.sql):

1. `chk_users_role_school_id`: Enforces `(role = 'SUPER_ADMIN' AND school_id IS NULL) OR (role <> 'SUPER_ADMIN' AND school_id IS NOT NULL)`.
2. `chk_academic_years_dates`: Enforces `end_date > start_date`.
3. `uq_academic_years_one_active_per_school`: Partial unique index `ON academic_years (school_id) WHERE status = 'ACTIVE'` (**BR-SCH-001**).
4. `chk_sections_capacity_positive`: `capacity IS NULL OR capacity > 0`.
5. `chk_attendance_late_minutes_positive`: `late_minutes IS NULL OR late_minutes > 0`.
6. `chk_assignments_max_points_positive` & `chk_submissions_score_non_negative`.
7. `chk_assessments_bounds`: `max_marks > 0 AND weight_percentage >= 0 AND weight_percentage <= 100`.
8. `chk_assessment_results_score_non_negative`: `score >= 0`.
9. `chk_feedbacks_single_parent`: Exactly one of `submission_id` or `assessment_result_id` is non-null.
10. `chk_progress_snapshots_bounds`: `period_end >= period_start` and rates in `[0, 100]`.
11. `chk_support_flags_dismissal_reason`: Dismissed flags require `char_length(btrim(dismissal_reason)) >= 10` (**BR-REV-002**).
12. `idx_support_flags_proposed_partial`: Partial index `ON support_flags (school_id, created_at DESC) WHERE status = 'PROPOSED'`.
