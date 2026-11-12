# Database Test Plan & Verification Results (Phase 5)

**Test Suite**: [`apps/api/src/shared/db/database.integration.test.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/shared/db/database.integration.test.ts)  
**Runner**: Vitest `5.1.0` against PostgreSQL `16.15` (`fsd_sdg4_test`)  
**Command**: `pnpm --filter '@fsd-sdg4/api' test:integration`

---

## Test Coverage Matrix (All 13 Required Categories)

|  #  | Test Category                    | Verification Mechanism                                                                                                     |  Status  |
| :-: | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------: |
|  1  | Database connectivity            | `SELECT 1 AS ok` via Prisma `$queryRaw`                                                                                    | **PASS** |
|  2  | Migration reproducibility        | Verifies `_prisma_migrations` applied `20261112065114_init` with `finished_at IS NOT NULL`                                 | **PASS** |
|  3  | Primary key integrity            | Rejects duplicate `School.id` UUID insertion                                                                               | **PASS** |
|  4  | Foreign key integrity            | Rejects `AcademicYear` referencing non-existent `schoolId`                                                                 | **PASS** |
|  5  | Unique constraints               | Rejects duplicate `(school_id, student_id_number)` and duplicate `ACTIVE` `AcademicYear` per school                        | **PASS** |
|  6  | Check constraints                | Rejects `endDate <= startDate`, invalid `SUPER_ADMIN`/`SCHOOL_ADMIN` `schoolId`, short dismissal reason, orphan `Feedback` | **PASS** |
|  7  | Referential deletion behavior    | `RESTRICT` blocks deleting `AcademicYear` with `Section`; `CASCADE` removes `SupportPlanAction` on draft plan delete       | **PASS** |
|  8  | Tenant relationship integrity    | Confirms valid same-school enrollments, attendance, and support records succeed                                            | **PASS** |
|  9  | Cross-school reference rejection | Rejects cross-school `Enrollment`, `AttendanceRecord`, and `SupportPlan` via composite `(school_id, id)` FKs               | **PASS** |
| 10  | Tenant isolation behavior        | Queries scoped by `schoolId` return strictly isolated records across 3 seeded tenants                                      | **PASS** |
| 11  | Transaction rollback behavior    | Throws inside `prisma.$transaction` and asserts earlier `Subject` insert rolled back                                       | **PASS** |
| 12  | Seed data consistency            | Re-runs `seedDatabase(prisma)` idempotently and verifies 3 synthetic tenants                                               | **PASS** |
| 13  | Relevant query behavior          | Queries `PROPOSED` support flags ordered by `createdAt DESC` using partial/composite index shape                           | **PASS** |

**Latest Observed Run**: `11 passed (11)` in `database.integration.test.ts` (exit code `0`).
