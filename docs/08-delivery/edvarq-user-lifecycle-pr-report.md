# Edvarq — Task 13 & Invitation Deduplication Completion Report

## Centralized User Lifecycle Management & Authoritative Final Best State Resolution

> **Date**: November 16, 2026  
> **Platform**: Edvarq — Institutional Intelligence SaaS  
> **Branch**: `feature/admin-portal`  
> **Target Branch**: `develop`  
> **Status**: `READY FOR REVIEW`

---

## 1. Executive Summary

This deliverable fulfills **Task 13 (Admin User Lifecycle Management)** and resolves the critical issue where repeated historical invitations appeared as duplicate entries and inflated dashboard KPI counters (as reported with `media_1794841676666_c3b4d0ea.jpg`).

Key capabilities delivered:

1. **Authoritative Invitation Deduplication ("Final Best State" Rule)**:
   - In both backend (`invitation.service.ts`) and frontend (`UserInvitationsPage.tsx`), invitations for the same recipient (`schoolId` + `email` + `role`) are consolidated into their authoritative **final best state** (`ACCEPTED` > `PENDING` > `EXPIRED` > `REVOKED`).
   - Old revoked records no longer spawn duplicate rows or allow illicit re-invitations for accounts that have already accepted and activated.
   - KPI metrics (`Total Issued`, `Pending Activation`, `Accepted & Active`, `Expired / Revoked`) across the Invitations Directory, School Admin Overview, and Super Admin Overview now report unique invited recipients accurately.
2. **Super Admin Platform User Governance (`/super-admin/users`)**:
   - Centralized management of platform administrators and school administrators.
   - Secure provisioning and cryptographic invitation dispatch to active school tenants.
   - Account status administration (`ACTIVE`, `LOCKED`, `INACTIVE`) with automated session revocation and strict **self-lockout prevention**.
   - Strict zero-trust privacy safeguard: platform administrators receive zero access to student learning records or classroom grades through this module.
3. **School Admin User Lifecycle Management (`/admin/users`)**:
   - Comprehensive tenant-isolated user directory covering Faculty, Students, and Parents.
   - Account suspension and reactivation with administrative audit logging.
   - Parental and guardian relationship management: link parents to students with verified relationship types (`MOTHER`, `FATHER`, `LEGAL_GUARDIAN`, `OTHER`) and primary emergency/academic contact designations, with atomic unlinking capability.
4. **Complete Verification & Stability**:
   - 200 unit, route, and UI tests passing across packages and applications.
   - Full production build passing cleanly.

---

## 2. Architectural & Security Architecture

### 2.1 Multi-Tenant Isolation & Zero Trust

- All School Admin endpoints (`/api/v1/school/users/*`, `/api/v1/school/students/:id/guardians/*`) enforce tenant boundary validation via `resolveTenantSchoolId(req)`.
- Attempting to inspect or alter users belonging to a different school returns an uninformative `404 Not Found`, preventing tenant enumeration attacks.
- Super Admin operations do not leak student profiles, course enrollments, or attendance data.

### 2.2 Invitation Deduplication Hierarchy

When listing invitations or computing summary KPIs, records for each distinct recipient (`(schoolId ?? 'platform'):email:role`) are ranked as follows:

|    Priority     | State      | Criteria                                                                                                |
| :-------------: | :--------- | :------------------------------------------------------------------------------------------------------ |
| **1 (Highest)** | `ACCEPTED` | User has redeemed their cryptographic token and activated their account.                                |
|      **2**      | `PENDING`  | An active invitation token exists and `now <= expiresAt`.                                               |
|      **3**      | `EXPIRED`  | Invitation expired without redemption (`now > expiresAt` or marked expired).                            |
|      **4**      | `REVOKED`  | Previous invitation was invalidated (e.g., during resend) and no newer active or accepted token exists. |

Tie-breaker: Most recent `createdAt` timestamp.

### 2.3 Account Governance & Self-Lockout Prevention

- An administrator cannot suspend or deactivate their own active user ID (`userId === req.auth.userId` throws a typed `BadRequestError`).
- When an account status is updated to `LOCKED` (suspended) or `INACTIVE`, all active sessions associated with that user ID are atomically deleted from the database session store, terminating active sessions immediately.

---

## 3. API Endpoints & Contracts

### Super Admin

| Method  | Route                                  | Description                                                    | Permissions             |
| :------ | :------------------------------------- | :------------------------------------------------------------- | :---------------------- |
| `GET`   | `/api/v1/super-admin/users`            | List platform & school administrators with pagination & search | `platform.users.read`   |
| `GET`   | `/api/v1/super-admin/users/:id`        | Detailed lifecycle history and audit logs                      | `platform.users.read`   |
| `POST`  | `/api/v1/super-admin/users/invite`     | Issue invitation to school admin for active school             | `platform.users.manage` |
| `PATCH` | `/api/v1/super-admin/users/:id/status` | Suspend or reactivate administrator account                    | `platform.users.manage` |

### School Admin

| Method   | Route                                                   | Description                                       | Permissions               |
| :------- | :------------------------------------------------------ | :------------------------------------------------ | :------------------------ |
| `GET`    | `/api/v1/school/users`                                  | List school users (Faculty, Students, Parents)    | `school.users.read`       |
| `GET`    | `/api/v1/school/users/:id`                              | Detailed user lifecycle and guardian associations | `school.users.read`       |
| `PATCH`  | `/api/v1/school/users/:id/status`                       | Suspend or reactivate user account in school      | `school.users.manage`     |
| `POST`   | `/api/v1/school/students/:id/guardians`                 | Link parent/guardian with relationship type       | `school.guardians.manage` |
| `DELETE` | `/api/v1/school/students/:id/guardians/:guardianUserId` | Unlink parent/guardian relationship               | `school.guardians.manage` |

---

## 4. Test Verification Summary

```text
✓ packages/shared-types: 4 tests passed
✓ packages/validation: 13 tests passed
✓ packages/contracts: 4 tests passed
✓ apps/api: 14 test files, 135 tests passed
    ✓ userLifecycle.routes.test.ts (12 tests)
    ✓ invitation.service.test.ts (17 tests)
    ✓ schoolAdmin.routes.test.ts (8 tests)
    ✓ superAdmin.routes.test.ts (8 tests)
✓ apps/web: 11 test files, 44 tests passed
    ✓ UserInvitationsPage.test.tsx (3 tests - deduplication verified)
    ✓ SchoolAdminPortal.test.tsx (7 tests)
    ✓ SuperAdminPortal.test.tsx (7 tests)
──────────────────────────────────────────────────────────────────
Total: 200 tests passing with 0 failures.
```

- **Formatting**: `pnpm format:check` clean (Prettier 100%).
- **TypeScript**: `pnpm typecheck` passed (0 errors across 6 projects).
- **Production Build**: `pnpm build` completed with production Vite chunks generated for `PlatformUsersPage` and `UserManagementPage`.

---

## 5. Branch & Review Protocol

- **Branch**: `feature/admin-portal`
- **Target**: `develop`
- **Delivery Commit**: `feat(admin): implement centralized user lifecycle management`
- **Review Status**: `READY FOR REVIEW`
