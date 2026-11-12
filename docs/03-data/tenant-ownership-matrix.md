# Tenant Ownership Matrix

This matrix establishes the definitive tenant ownership model for every entity in the **FSD-SDG-4 Quality Education SaaS** database, ensuring clear isolation boundaries and data partition rules.

---

## 1. Ownership Categorization

1. **Platform-Global**: Entities that transcend individual school tenants (e.g. system configurations, global audit logs). Only accessible by `SUPER_ADMIN`.
2. **Tenant-Root**: The root institutional record (`School`). Represents the institutional boundary.
3. **Tenant-Owned**: Entities that belong strictly to a single school tenant. Must contain a non-nullable `school_id UUID REFERENCES schools(id) ON DELETE CASCADE`.

---

## 2. Definitive Entity Ownership Matrix

| Entity Name            | Tenancy Category                           | Tenant Foreign Key | Column Nullable? |   On Tenant Delete   | Cross-Tenant Query Guard                        |
| :--------------------- | :----------------------------------------- | :----------------- | :--------------: | :------------------: | :---------------------------------------------- |
| `School`               | **Tenant-Root**                            | `id` (Self)        |        No        | Deletes all children | Platform Admin only                             |
| `User`                 | **Conditional** (`NULL` iff `SUPER_ADMIN`) | `school_id`        | **Conditional**  |     **CASCADE**      | `chk_users_role_school_id` + Phase 6 Prisma ext |
| `Session`              | **Conditional** (`NULL` iff `SUPER_ADMIN`) | `school_id`        | **Conditional**  |     **CASCADE**      | Enforced via Phase 6 Prisma extension           |
| `AcademicYear`         | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Class`                | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Section`              | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Subject`              | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `CourseOffering`       | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `CourseTeacher`        | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `StudentProfile`       | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `TeacherProfile`       | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Enrollment`           | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `GuardianRelationship` | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `AttendanceRecord`     | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `LearningResource`     | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Assignment`           | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `AssignmentSubmission` | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Assessment`           | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `AssessmentResult`     | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `Feedback`             | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `ProgressSnapshot`     | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `SupportFlag`          | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `SupportPlan`          | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `SupportPlanAction`    | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `SupportReview`        | **Tenant-Owned**                           | `school_id`        |      **No**      |     **CASCADE**      | Enforced via Prisma extension                   |
| `AuditLog`             | **Conditional** (`NULL` for global admin)  | `school_id`        |     **Yes**      |     **CASCADE**      | Read-only append-only log                       |

> **Phase 5 Composite Foreign Key Protection**: Every tenant-owned parent model exposes `@@unique([schoolId, id])`, and every child relation references `[schoolId, parentId]` -> `[schoolId, id]`. PostgreSQL rejects cross-school foreign key references at the storage layer.
