# Data Dictionary Specification & Template

This document provides the standardized data dictionary template and representative samples for defining physical and logical tables during **Phase 5 (Database Schema Design & Migrations)**.

---

## 1. Data Dictionary Schema Template

Every relational table definition in Phase 5 must adhere to the following schema table specification:

### Table: `table_name_plural`

- **Domain Cluster**: _[e.g., Daily Operations / Support Intervention]_
- **Owning Module**: _[e.g., `backend/src/modules/attendance`]_
- **Multi-Tenant Scoped**: Yes (`school_id UUID REFERENCES schools(id)`)
- **Table Description**: Concise explanation of the entity's business role and lifecycle.

| Column Name  | Data Type (PostgreSQL) | Nullable? | Default Value       | Foreign Key Reference           | Constraints / Check Rules | Description & Usage                 |
| :----------- | :--------------------- | :-------: | :------------------ | :------------------------------ | :------------------------ | :---------------------------------- |
| `id`         | `UUID`                 |    No     | `gen_random_uuid()` | None                            | Primary Key               | Surrogate primary key identifier.   |
| `school_id`  | `UUID`                 |    No     | None                | `schools(id) ON DELETE CASCADE` | Indexed                   | Institutional tenant ownership key. |
| `created_at` | `TIMESTAMPTZ`          |    No     | `NOW()`             | None                            | Indexed                   | Timestamp of record creation.       |
| `updated_at` | `TIMESTAMPTZ`          |    No     | `NOW()`             | None                            | None                      | Timestamp of last modification.     |

---

## 2. Representative Sample: `support_plans`

- **Domain Cluster**: Support & Intervention
- **Owning Module**: `support-intervention`
- **Multi-Tenant Scoped**: Yes (`school_id`)
- **Table Description**: Stores formal student support plans, target recovery goals, assigned lead teachers, and scheduled review milestones.

| Column Name       | Data Type (PostgreSQL) | Nullable? | Default Value       | Foreign Key Reference                     | Constraints / Check Rules                                         | Description & Usage                   |
| :---------------- | :--------------------- | :-------: | :------------------ | :---------------------------------------- | :---------------------------------------------------------------- | :------------------------------------ |
| `id`              | `UUID`                 |    No     | `gen_random_uuid()` | None                                      | Primary Key                                                       | Unique plan identifier.               |
| `school_id`       | `UUID`                 |    No     | None                | `schools(id) ON DELETE CASCADE`           | B-Tree Index                                                      | School tenant partition key.          |
| `student_id`      | `UUID`                 |    No     | None                | `student_profiles(id) ON DELETE RESTRICT` | B-Tree Index                                                      | Student receiving support.            |
| `lead_teacher_id` | `UUID`                 |    No     | None                | `teacher_profiles(id) ON DELETE RESTRICT` | None                                                              | Educator managing the plan.           |
| `support_flag_id` | `UUID`                 |    Yes    | `NULL`              | `support_flags(id) ON DELETE SET NULL`    | None                                                              | Triggering flag if applicable.        |
| `status`          | `VARCHAR(32)`          |    No     | `'ACTIVE'`          | None                                      | `CHECK (status IN ('ACTIVE','RESOLVED','CONTINUED','ESCALATED'))` | Current lifecycle state.              |
| `problem_summary` | `TEXT`                 |    No     | None                | None                                      | `LENGTH(problem_summary) >= 10`                                   | Transparent description of challenge. |
| `target_goal`     | `TEXT`                 |    No     | None                | None                                      | `LENGTH(target_goal) >= 10`                                       | Measurable SMART goal.                |
| `review_date`     | `DATE`                 |    No     | None                | None                                      | `review_date > CURRENT_DATE`                                      | Scheduled formal review date.         |
| `created_at`      | `TIMESTAMPTZ`          |    No     | `NOW()`             | None                                      | None                                                              | Plan creation timestamp.              |
| `updated_at`      | `TIMESTAMPTZ`          |    No     | `NOW()`             | None                                      | None                                                              | Last update timestamp.                |

**Indexes**:

- `CREATE INDEX idx_support_plans_tenant_student ON support_plans (school_id, student_id);`
- `CREATE INDEX idx_support_plans_tenant_review ON support_plans (school_id, review_date) WHERE status = 'ACTIVE';`
