# Team Development Contract — FSD-SDG-4 Quality Education SaaS

**Date**: 2026-11-12  
**Baseline Commit**: `f9606f6` (`develop` / `main`)  
**Target Team**: 4 Parallel Portal Developers

---

## 1. Portal Ownership Matrix

| Developer       | Assigned Portal(s)                      | Branch                   | Primary Frontend Scope (`apps/web/src/`)          | Primary Backend Scope (`apps/api/src/modules/`)                                    |
| :-------------- | :-------------------------------------- | :----------------------- | :------------------------------------------------ | :--------------------------------------------------------------------------------- |
| **Developer 1** | **Platform Super Admin & School Admin** | `feature/admin-portal`   | `features/super-admin/`, `features/school-admin/` | `schools/`, `users/` (admin user/school/guardian management)                       |
| **Developer 2** | **Teacher**                             | `feature/teacher-portal` | `features/teacher/`                               | `attendance/`, `coursework/`, `assessments/`, `support-intervention/`              |
| **Developer 3** | **Student**                             | `feature/student-portal` | `features/student/`                               | Student-scoped endpoints in `coursework/`, `assessments/`, `support-intervention/` |
| **Developer 4** | **Parent / Guardian**                   | `feature/parent-portal`  | `features/parent/`                                | Read-only linked-child endpoints (`assertVerifiedGuardian`)                        |

---

## 2. Shared Ownership Rules (Protected Paths)

No individual developer may unilaterally modify shared foundation files on a portal branch without team coordination.

| Shared Area                         | Repository Paths                                                                                        | Owner / Gatekeeper               | Change Protocol                                                                                                                                                                                 |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & Sessions**       | `apps/api/src/modules/auth/`, `apps/api/src/middleware/authenticate.ts`, `authorize.ts`, `csrf.ts`      | Tech Lead (Vivek)                | Propose via PR targeting `develop`; requires security review + auth test pass                                                                                                                   |
| **Database Schema & Migrations**    | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/prisma/seed.ts`               | Database Lead (Yashwardhan)      | Never edit applied migrations; additive migrations only via `prisma migrate dev`                                                                                                                |
| **API Contracts & Shared Packages** | `packages/contracts/`, `packages/shared-types/`, `packages/validation/`, `apps/api/src/docs/openapi.ts` | Tech Lead + Affected Portal Devs | Update contract + rebuild `./packages/*` + verify both `apps/api` and `apps/web`                                                                                                                |
| **Shared UI Components**            | `apps/web/src/components/`                                                                              | Frontend Lead (Vishwanath)       | Must follow [`02-component-specifications.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/02-component-specifications.md) & WCAG 2.2 AA |
| **Design Tokens**                   | `apps/web/src/styles/globals.css`                                                                       | Frontend Lead (Vishwanath)       | Must match [`01-design-tokens.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/01-design-tokens.md); no arbitrary hex overrides          |
| **Global Routing**                  | `apps/web/src/App.tsx`, `apps/api/src/routes/v1/index.ts`                                               | Tech Lead + Frontend Lead        | Register portal route prefixes cleanly to avoid merge conflicts                                                                                                                                 |
| **App Configuration**               | `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `apps/api/src/config/env.ts`               | Tech Lead (Vivek)                | Requires explicit justification and full monorepo CI pass                                                                                                                                       |

---

## 3. Shared Change Proposal & Review Process

1. **Before Modifying a Shared File**: Open a short RFC/issue or coordinate in the team channel before editing any protected path in Section 2.
2. **Contract-First Updates**: Backend and frontend changes sharing a payload must update `packages/contracts` and `packages/validation` first, rebuild shared packages (`pnpm --filter './packages/*' build`), and merge into `develop` so all 4 portal branches can rebase cleanly.
3. **Mandatory Verification Before PR**:
   - `pnpm format:check`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
4. **Security Non-Negotiables**:
   - Never trust client-supplied `schoolId` or `role` values.
   - Never store auth tokens in `localStorage` or `sessionStorage`.
   - Always enforce `authenticate`, `requirePermission(...)`, `requireCsrfHeader` (on mutations), and tenant/relationship guards (`resolveTenantSchoolId`, `assertTeacherAssignedToCourse`, `assertStudentSelf`, `assertVerifiedGuardian`).
