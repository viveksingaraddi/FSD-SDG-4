# FSD-SDG-4 — Admin Portal Implementation Plan

**Project:** FSD-SDG-4 Quality Education SaaS  
**Branch:** `feature/admin-portal` (branched from `develop` at `d6a7825`)  
**Assigned Developer:** Developer 1 — Project Lead (`SUPER_ADMIN` + `SCHOOL_ADMIN`)

> **Inspected Repository Reality:** Phase 9 established the shared React foundation (`apps/web/src/components/ui/`, `AppShell`, `AuthContext`, `apiClient`, `createZodResolver`, `ROLE_NAV_ITEMS`). On `feature/admin-portal`, initial Super Admin and School Admin backend modules (`apps/api/src/modules/super-admin/`, `apps/api/src/modules/school-admin/`), shared contracts/validation (`packages/contracts`, `packages/validation`), and initial portal pages (`apps/web/src/features/super-admin/`, `apps/web/src/features/admin/`) are staged in the working tree. This plan catalogs the complete scope, classifies every API dependency honestly, and identifies remaining gaps for human review before further implementation or merge.

---

## 1. Product Scope

### 1.1 Platform Super Admin (`SUPER_ADMIN`)

- **Platform Dashboard**: Total registered schools, active/suspended counts, total platform users, immutable audit event count, and quick operational links.
- **School Management**: School tenant directory, search by name/code/subdomain, tenant deep inspection, school provisioning (`ACTIVE`), and status transitions (`ACTIVE` / `SUSPENDED`).
- **Platform User & Role Administration**: **Partially supported** — platform user count telemetry is available; cross-tenant individual user listing, initial `SCHOOL_ADMIN` provisioning per tenant, and role reassignment endpoints are not yet implemented (see Section 7).
- **Platform Analytics**: High-level adoption counts (`totalSchools`, `activeSchools`, `suspendedSchools`, `totalUsers`). Detailed time-series adoption charts and exportable operational reports are deferred unless backend telemetry endpoints are added.
- **Platform Settings & Audit**: Security/session policy summary and cross-tenant immutable audit log stream (`audit_logs`) with action filtering.

### 1.2 School Administrator (`SCHOOL_ADMIN`)

- **School Dashboard**: Active academic year indicator, enrolled student count, teaching staff count, class/section totals, and active human-reviewed support plan count.
- **Student Management**: Student directory, search by name/student ID, admission registration (`User` + `StudentProfile` + optional initial `Enrollment`), and active section visibility. Batch CSV import (P1) and student profile editing/withdrawal are deferred.
- **Teacher Management**: Staff directory, teacher provisioning (`User` + `TeacherProfile`), and account activation/deactivation (`ACTIVE` / `INACTIVE`). Course offering allocation (`CourseTeacher` / `CourseOffering`) is deferred pending API implementation.
- **Academic Management**: Academic year creation and active-term rollover/activation (`PLANNED`/`ARCHIVED` -> `ACTIVE`), grade-level `Class` creation, `Section` creation, and `Subject` catalog registration.
- **School Settings & Audit**: School profile management (`name`, `contactEmail`) and tenant-scoped immutable audit log stream. Logo file upload / attendance cutoff settings are deferred (no dedicated backend storage or settings columns exist in `School` schema).

---

## 2. Super Admin Sitemap

| Route ID (Phase 2)  | Planned URL Path (`apps/web`)    | View Title                      | Guard         | Notes                                                             |
| ------------------- | -------------------------------- | ------------------------------- | ------------- | ----------------------------------------------------------------- |
| `RT-SUP-01`         | `/super-admin`                   | Platform Overview               | `SUPER_ADMIN` | Reconciles Phase 2 `/admin/dashboard` to `/super-admin` namespace |
| `RT-SUP-02`         | `/super-admin/schools`           | Tenant Directory & Provisioning | `SUPER_ADMIN` | Search, create, suspend/activate                                  |
| `RT-SUP-03`         | `/super-admin/schools/:schoolId` | Tenant Inspection & Config      | `SUPER_ADMIN` | Deep inspection & access toggle                                   |
| `RT-SUP-04`         | `/super-admin/governance`        | Platform Security Stream        | `SUPER_ADMIN` | Cross-tenant `audit_logs` stream                                  |
| `RT-SUP-05` (Added) | `/super-admin/settings`          | Platform Settings               | `SUPER_ADMIN` | Security/tenancy policy overview                                  |

> **Namespace Note:** Phase 2 `sitemap.md` listed Super Admin under `/admin/*` and School Admin under `/school/*`. Phase 9 (`AuthContext.tsx`) standardized `/super-admin/*` for `SUPER_ADMIN` and `/admin/*` for `SCHOOL_ADMIN` so there is zero collision between the two admin roles.

---

## 3. School Admin Sitemap

| Route ID (Phase 2)        | Planned URL Path (`apps/web`)      | View Title                         | Guard          | Notes                                              |
| ------------------------- | ---------------------------------- | ---------------------------------- | -------------- | -------------------------------------------------- |
| `RT-ADM-01`               | `/admin`                           | Institutional Overview             | `SCHOOL_ADMIN` | School metrics & quick links                       |
| `RT-ADM-02`               | `/admin/academic` (Tab: Years)     | Academic Terms & Rollover          | `SCHOOL_ADMIN` | Create & activate academic year                    |
| `RT-ADM-03`               | `/admin/academic` (Tab: Classes)   | Classes & Section Setup            | `SCHOOL_ADMIN` | Grade levels & section rosters                     |
| `RT-ADM-04`               | `/admin/academic` (Tab: Subjects)  | Curriculum Subject Catalog         | `SCHOOL_ADMIN` | Subject registration with codes                    |
| `RT-ADM-05`               | `/admin/academic` (Tab: Offerings) | Course Offering Allocations        | `SCHOOL_ADMIN` | **Deferred** (API missing)                         |
| `RT-ADM-06`               | `/admin/staff`                     | Staff Directory & Roles            | `SCHOOL_ADMIN` | Teacher provisioning & status                      |
| `RT-ADM-07`               | `/admin/students`                  | Student Directory & Intake         | `SCHOOL_ADMIN` | Admission & initial enrollment                     |
| `RT-ADM-08`               | `/admin/support-overview`          | Pastoral Care Analytics            | `SCHOOL_ADMIN` | Summary KPI on dashboard; detail view **Deferred** |
| `RT-ADM-09` & `RT-ADM-10` | `/admin/settings`                  | Settings & Institutional Audit Log | `SCHOOL_ADMIN` | School profile form + audit stream                 |

---

## 4. Screen Inventory

| Screen ID          | Screen Name              | Route                            | Primary Action                                                         | Empty / Loading / Error Coverage                                   |
| ------------------ | ------------------------ | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `SCR-SUP-01`       | Platform Overview        | `/super-admin`                   | View KPIs & navigate to tenants/logs                                   | `Skeleton` cards, `ErrorState` with retry                          |
| `SCR-SUP-02`       | Schools Directory        | `/super-admin/schools`           | Search, provision school (`Modal`), suspend/activate (`ConfirmDialog`) | `DataTable` loading skeleton, `EmptyState`, `ErrorState`, `Alert`  |
| `SCR-SUP-03`       | Tenant Inspection        | `/super-admin/schools/:schoolId` | Inspect counts & toggle tenant status (`ConfirmDialog`)                | `Skeleton`, `ErrorState`                                           |
| `SCR-SUP-04`       | Platform Security Stream | `/super-admin/governance`        | Filter cross-tenant audit events                                       | `DataTable` skeleton, `EmptyState`, `ErrorState`                   |
| `SCR-SUP-05`       | Platform Settings        | `/super-admin/settings`          | Inspect enforced platform policies                                     | Static policy cards                                                |
| `SCR-ADM-01`       | School Overview          | `/admin`                         | View institutional KPIs & quick links                                  | `Skeleton` cards, `ErrorState` with retry                          |
| `SCR-ADM-02/03/04` | Academic Setup           | `/admin/academic`                | Manage Academic Years, Classes/Sections, Subjects                      | Tabbed `DataTable`/`Card` views, `Modal`, `ConfirmDialog`, `Alert` |
| `SCR-ADM-06`       | Staff Directory          | `/admin/staff`                   | Provision teacher (`Modal`), activate/deactivate (`ConfirmDialog`)     | `DataTable` skeleton, `EmptyState`, `ErrorState`, `Alert`          |
| `SCR-ADM-07`       | Student Directory        | `/admin/students`                | Search students, register admission (`Modal`)                          | `DataTable` skeleton, `EmptyState`, `ErrorState`, `Alert`          |
| `SCR-ADM-09/10`    | Settings & Audit Log     | `/admin/settings`                | Update school name/email, inspect tenant audit log                     | `Skeleton`, `ErrorState`, `DataTable`, toast feedback              |

---

## 5. Navigation Structure (`apps/web/src/config/navigation.ts`)

- **Super Admin Sidebar / Mobile Bottom Nav**:
  - `Platform Overview` (`/super-admin`)
  - `Schools` (`/super-admin/schools`)
  - `Governance` (`/super-admin/governance`)
  - `Settings` (`/super-admin/settings`)
- **School Admin Sidebar / Mobile Bottom Nav**:
  - `School Overview` (`/admin`)
  - `Academic Setup` (`/admin/academic`)
  - `Staff & Teachers` (`/admin/staff`)
  - `Students` (`/admin/students`)
  - `Settings & Audit` (`/admin/settings`)

**Isolation Guarantee:** Hiding links in `navigation.ts` is strictly UX convenience. `<ProtectedRoute allowedRoles={[...]} />` guards client routes, and every `/api/v1/super-admin/*` and `/api/v1/school/*` backend route enforces `authenticate`, `requireRole`, `requirePermission`, and `resolveTenantSchoolId`.

---

## 6. Permission Matrix

Mapped against `apps/api/src/modules/identity/permissions.ts`:

| Screen / Action                                          | Role           | Backend Permission Required                     | Missing Permission?                              |
| -------------------------------------------------------- | -------------- | ----------------------------------------------- | ------------------------------------------------ |
| Platform Overview (`GET`)                                | `SUPER_ADMIN`  | `platform.schools.read`                         | None                                             |
| List / Inspect Schools (`GET`)                           | `SUPER_ADMIN`  | `platform.schools.read`                         | None                                             |
| Provision School (`POST`)                                | `SUPER_ADMIN`  | `platform.schools.create`                       | None                                             |
| Update / Suspend School (`PATCH`)                        | `SUPER_ADMIN`  | `platform.schools.update`                       | None                                             |
| Platform Audit Stream (`GET`)                            | `SUPER_ADMIN`  | `platform.audit.read`                           | None                                             |
| Platform User Directory / Admin Provisioning             | `SUPER_ADMIN`  | **Missing** (no `platform.users.*` permission)  | **Yes** — coordinate before adding user-admin UI |
| School Overview (`GET`)                                  | `SCHOOL_ADMIN` | `school.classes.read`                           | None                                             |
| Academic Years / Classes / Sections / Subjects (`GET`)   | `SCHOOL_ADMIN` | `school.classes.read`                           | None                                             |
| Create / Activate Academic Year, Class, Section, Subject | `SCHOOL_ADMIN` | `school.classes.manage`                         | None                                             |
| List Staff / Students (`GET`)                            | `SCHOOL_ADMIN` | `school.users.read`                             | None                                             |
| Provision Teacher / Register Student (`POST`)            | `SCHOOL_ADMIN` | `school.users.create`                           | None                                             |
| Activate / Deactivate Staff (`PATCH`)                    | `SCHOOL_ADMIN` | `school.users.update`                           | None                                             |
| School Audit Log (`GET`)                                 | `SCHOOL_ADMIN` | `school.audit.read`                             | None                                             |
| School Settings (`GET` / `PATCH`)                        | `SCHOOL_ADMIN` | `school.classes.read` / `school.classes.manage` | Optional dedicated `school.settings.manage`      |
| Guardian Link Management                                 | `SCHOOL_ADMIN` | `school.guardians.manage`                       | Permission exists; endpoint missing              |

---

## 7. API Dependency Matrix

| Feature / Action             | Method & Path                                                     | Request Contract                              | Response Contract          | Permission & Tenant Scope                                         | Classification                                                                            |
| ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------- | -------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Platform Overview            | `GET /api/v1/super-admin/overview`                                | None                                          | `PlatformOverviewDto`      | `platform.schools.read` (Platform)                                | **Implemented and verified**                                                              |
| List / Search Schools        | `GET /api/v1/super-admin/schools?search=`                         | `searchQuerySchema`                           | `SchoolSummaryDto[]`       | `platform.schools.read` (Platform)                                | **Implemented and verified**                                                              |
| Inspect School               | `GET /api/v1/super-admin/schools/:id`                             | `idParamSchema`                               | `SchoolDetailDto`          | `platform.schools.read` (Platform)                                | **Implemented and verified**                                                              |
| Provision School             | `POST /api/v1/super-admin/schools`                                | `createSchoolSchema`                          | `SchoolSummaryDto`         | `platform.schools.create` (Platform)                              | **Implemented and verified**                                                              |
| Update / Suspend School      | `PATCH /api/v1/super-admin/schools/:id`                           | `updateSchoolSchema`                          | `SchoolSummaryDto`         | `platform.schools.update` (Platform)                              | **Implemented and verified**                                                              |
| Platform Audit Logs          | `GET /api/v1/super-admin/audit-logs`                              | `action` query                                | `AuditLogDto[]`            | `platform.audit.read` (Platform)                                  | **Implemented and verified**                                                              |
| School Overview              | `GET /api/v1/school/overview`                                     | None                                          | `SchoolOverviewDto`        | `school.classes.read` (`req.auth.schoolId`)                       | **Implemented and verified**                                                              |
| Academic Years CRUD          | `GET/POST /api/v1/school/academic-years`, `PATCH /:id/activate`   | `createAcademicYearSchema`                    | `AcademicYearDto`          | `school.classes.read` / `.manage` (`req.auth.schoolId`)           | **Implemented and verified**                                                              |
| Classes & Sections           | `GET/POST /api/v1/school/classes`, `POST /api/v1/school/sections` | `createClassSchema`, `createSectionSchema`    | `ClassDto[]`, `SectionDto` | `school.classes.read` / `.manage` (`req.auth.schoolId`)           | **Implemented and verified**                                                              |
| Subjects                     | `GET/POST /api/v1/school/subjects`                                | `createSubjectSchema`                         | `SubjectDto[]`             | `school.classes.read` / `.manage` (`req.auth.schoolId`)           | **Implemented and verified**                                                              |
| Staff Directory              | `GET/POST /api/v1/school/staff`, `PATCH /:id/status`              | `createStaffSchema`, `updateUserStatusSchema` | `StaffMemberDto[]`         | `school.users.read` / `.create` / `.update` (`req.auth.schoolId`) | **Implemented and verified**                                                              |
| Student Directory            | `GET/POST /api/v1/school/students`                                | `createStudentSchema`                         | `StudentDirectoryDto[]`    | `school.users.read` / `.create` (`req.auth.schoolId`)             | **Implemented and verified**                                                              |
| School Audit Logs            | `GET /api/v1/school/audit-logs`                                   | None                                          | `AuditLogDto[]`            | `school.audit.read` (`req.auth.schoolId`)                         | **Implemented and verified**                                                              |
| School Settings              | `GET/PATCH /api/v1/school/settings`                               | `updateSchoolSettingsSchema`                  | `SchoolSettingsDto`        | `school.classes.read` / `.manage` (`req.auth.schoolId`)           | **Implemented and verified**                                                              |
| Course Offerings Matrix      | `GET/POST /api/v1/school/offerings`                               | Pending schema                                | Pending DTO                | `school.classes.manage` (`req.auth.schoolId`)                     | **Contract exists (`API_ROUTES.SCHOOL.OFFERINGS`), implementation missing**               |
| Tenant Admin Provisioning    | `POST /api/v1/super-admin/schools/:id/admins`                     | None                                          | None                       | `SUPER_ADMIN`                                                     | **Contract missing**                                                                      |
| Platform User Administration | `/api/v1/super-admin/users`                                       | None                                          | None                       | `SUPER_ADMIN`                                                     | **Contract missing**                                                                      |
| Guardian Link Management     | `/api/v1/school/guardians`                                        | None                                          | None                       | `school.guardians.manage`                                         | **Contract missing**                                                                      |
| School Logo Binary Upload    | `/api/v1/school/settings/logo`                                    | None                                          | None                       | `SCHOOL_ADMIN`                                                    | **Not supported by approved requirements / schema** (no object storage in Phase 5 schema) |

---

## 8. Shared Component Reuse Plan

All Admin Portal views reuse existing Phase 9 primitives without creating duplicate UI components:

- `AppShell` (`apps/web/src/components/layout/AppShell.tsx`) for responsive navigation, header, breadcrumbs, and sign-out.
- `Heading`, `Text`, `Card`, `Badge`, `Tabs`, `DataTable`, `SearchInput`, `Button`, `FormField`, `Input`, `PasswordInput`, `Select`, `Modal`, `ConfirmDialog`, `Alert`, `Skeleton`, `EmptyState`, `ErrorState`, `useToast` from `@/components/ui`.
- `apiGet`, `apiPost`, `apiPatch`, `ApiClientError` from `@/lib/apiClient` and `createZodResolver` from `@/lib/zodResolver`.

---

## 9. Responsive Design Plan

- **Desktop (`>= 1024px`)**: `240px` fixed left sidebar, multi-column KPI grids (`lg:grid-cols-4`), full `DataTable` rows, centered `Modal` / `ConfirmDialog`.
- **Tablet (`768px–1023px`)**: `64px` collapsed icon rail sidebar, 2-column KPI grids (`sm:grid-cols-2`), horizontal-scroll-safe `DataTable` region (`tabIndex={0}`).
- **Mobile (`< 768px`)**: Slide-out `Drawer` navigation + `56px` fixed bottom nav, stacked single-column KPI cards, `44px` minimum touch targets on buttons/inputs, and container-query `.responsive-table` card stacking.

---

## 10. Implementation Sequence

1. **Gate 1 (Current)**: Human review and approval of this implementation plan (`docs/08-delivery/admin-portal-implementation-plan.md`) and verification of the already-staged `feature/admin-portal` Admin Portal modules.
2. **Gate 2 (If Approved)**: Implement missing coordinated APIs (`API_ROUTES.SCHOOL.OFFERINGS` for `SCR-ADM-05`, initial `SCHOOL_ADMIN` provisioning per tenant, and `school.guardians.manage` endpoints for Parent Portal readiness).
3. **Gate 3 (If Approved)**: Add the Course Offerings tab in `AcademicSetupPage` and any approved Super Admin user-provisioning modal.
4. **Gate 4 (PR Integration)**: Finalize `format:check`, `lint`, `typecheck`, unit/integration tests, and `vite build`, then open PR from `feature/admin-portal` into `develop`.

---

## 11. Testing Strategy

- **Unit & Component Tests (`apps/web`)**:
  - `SuperAdminPortal.test.tsx`: Platform metrics rendering, school directory table, provisioning modal interaction.
  - `SchoolAdminPortal.test.tsx`: School metrics rendering, `AcademicSetupPage` tab switching, loading/error states.
  - Expand with tests for `StaffDirectoryPage`, `StudentDirectoryPage`, `SchoolSettingsPage`, `PlatformGovernancePage`, and cross-role `ProtectedRoute` isolation (`/admin` rejected for `SUPER_ADMIN`, `/super-admin` rejected for `SCHOOL_ADMIN`).
- **API Integration & Security Tests (`apps/api`)**:
  - `superAdmin.routes.test.ts` & `schoolAdmin.routes.test.ts`: `401` unauthenticated, `403` cross-role, `403` CSRF protection, `422` Zod validation, and `resolveTenantSchoolId` isolation.
- **Accessibility & Build Gates**:
  - `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm --filter @fsd-sdg4/web build`, and WCAG 2.2 AA attribute checks (`aria-invalid`, `aria-describedby`, `role="region"`, `<time>`, native `<dialog>`).

---

## 12. Dependencies and Unresolved Questions

1. **Course Offerings (`SCR-ADM-05`)**: Confirm whether `API_ROUTES.SCHOOL.OFFERINGS` should be implemented in this branch before merging `feature/admin-portal` into `develop` (also needed by Teacher Portal `feature/teacher-portal`).
2. **Tenant Admin Bootstrapping**: Confirm whether Super Admin needs a `POST /api/v1/super-admin/schools/:id/admins` endpoint to create the first `SCHOOL_ADMIN` user when onboarding a new school.
3. **Pastoral Care Analytics (`SCR-ADM-08`)**: Confirm whether the existing `activeSupportPlans` KPI on `SchoolAdminDashboardPage` satisfies P0 or if a dedicated `/admin/support-overview` read-only breakdown is required before Teacher Support workflows are built.
4. **Parent Portal Scope (`OQ-002`)**: Guardian link endpoints (`school.guardians.manage`) depend on Product Owner confirmation of Parent Portal scope.
