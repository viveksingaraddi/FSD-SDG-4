# Database Security Review (Phase 5)

**Status**: Verified for Phase 5 Baseline\
**Scope**: PostgreSQL `16.15`, Prisma `6.19.3`,
[`apps/api/prisma/schema.prisma`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/schema.prisma),
[`apps/api/prisma/seed.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/prisma/seed.ts)

---

## 1. Security Controls Implemented

1. **Composite Tenant Foreign Key Protection**:
   - Every tenant-owned parent model defines `@@unique([schoolId, id])`.
   - Child tables reference `[schoolId, parentId]` -> `[schoolId, id]`.
     Cross-school links (e.g., enrolling School B's student in School A's
     section) are rejected at the PostgreSQL storage engine level.
2. **Super Admin vs. School User Separation**:
   - `chk_users_role_school_id` prevents `SUPER_ADMIN` accounts from holding a
     `school_id` and prevents school-scoped roles from existing with
     `school_id IS NULL`.
3. **Zero Real PII & Minimized Student Attributes**:
   - `student_profiles` stores only institutional identifiers
     (`student_id_number`), `first_name`, `last_name`, optional `date_of_birth`,
     optional `gender`, `status`, and `admission_date`. National IDs, home
     addresses, and phone numbers are excluded.
   - `apps/api/prisma/seed.ts` uses `.example.invalid` domains, synthetic names,
     and placeholder hash `SYNTHETIC_DEV_HASH_NOT_FOR_PRODUCTION_USE`.
4. **No Secrets in Git**:
   - `.gitignore` excludes `.env`, `.env.local`, `.env.test`, and environment
     overrides.
   - `apps/api/src/config/env.ts` validates `DATABASE_URL` via Zod at boot
     without logging credentials.
5. **Safe Logging**:
   - `apps/api/src/shared/db/prisma.ts` enables only `['warn', 'error']` in
     development and `['error']` in test/production (query parameter logging is
     disabled to avoid leaking student data into logs).
6. **Least-Privilege & Migration Controls (Operational Policy)**:
   - Production deployments will separate `fsd_migrator` (DDL migrations only)
     from `fsd_app` (DML runtime only; no `TRUNCATE`/`DROP`).

---

## 2. Pending Security Controls (Scheduled for Phases 6–7 & 15)

- **Phases 6–7**: Prisma Client extension for automatic `schoolId` query
  scoping, Argon2id password hashing, HttpOnly/Secure/SameSite session cookies,
  and RBAC guards protecting guardian, assessment, and support-plan endpoints.
- **Phase 15**: PgBouncer transaction-pooling benchmark and final decision on
  activating PostgreSQL RLS (`ADR-0007`).
