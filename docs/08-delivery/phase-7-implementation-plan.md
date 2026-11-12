# Phase 7 Implementation Plan — Authentication, RBAC & Multi-Tenant Security

**Date**: 2026-11-12  
**Phase**: Phase 7 — Authentication, Sessions, RBAC & Tenant Isolation  
**Prerequisites**: Phase 5 (`COMPLETED`), Phase 6 (`COMPLETED`)

---

## 1. Schema & Migration Assessment

Inspection of `apps/api/prisma/schema.prisma` confirms `User`, `Session`, `School`, `GuardianRelationship`, `CourseTeacher`, `StudentProfile`, `TeacherProfile`, and `AuditLog` exist from Phase 5. Two targeted additions are required in a **new** Phase 7 Prisma migration (never modifying `20261112065114_init`):

1. **`PasswordResetToken` model**: Stores SHA-256 `tokenHash`, `userId`, `expiresAt`, `usedAt`, and `createdAt` to enforce single-use, expiring, auditable password recovery.
2. **`GuardianRelationship` verification fields**: Adds `isVerified` (`Boolean @default(false)`) and `verifiedAt` (`DateTime?`) so unverified guardian links never grant access to student records.

---

## 2. Authentication & Session Architecture

- **Argon2id Password Hashing**: Implemented via `argon2` (`argon2id`, `memoryCost: 65536` / 64 MB, `timeCost: 3`, `parallelism: 4`).
- **Password Policy**: Minimum 12 characters, maximum 128 characters, requiring uppercase, lowercase, digit, and symbol.
- **Server-Managed Sessions**:
  - 256-bit cryptographically random token (`crypto.randomBytes(32).toString('base64url')`), persisted as SHA-256 `tokenHash` in `sessions`.
  - Delivered via `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (in `production`/`staging`), 8-hour `Max-Age` cookie (`sid`).
  - Session rotation on login and password change; instant server-side deletion on logout, individual session revocation (`DELETE /api/v1/auth/sessions/:sessionId`), password change, and password reset.
- **CSRF Defense**: Dual-layer defense combining `SameSite=Lax` cookies with a custom header check (`X-Requested-With` or `Content-Type: application/json`) on state-changing cookie-authenticated requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Account Lifecycle**: Only `User.status === 'ACTIVE'`, `User.deletedAt === null`, and (for school-scoped users) `School.status === 'ACTIVE'` may authenticate or retain active sessions.

---

## 3. Endpoints Under `/api/v1/auth`

- `POST /api/v1/auth/login` (sensitive rate limiter, generic error on invalid credentials or inactive account)
- `POST /api/v1/auth/logout` (authenticated, CSRF-protected, deletes active session & clears cookie)
- `GET /api/v1/auth/me` (authenticated, returns safe user profile, role, schoolId, and granted permissions)
- `POST /api/v1/auth/forgot-password` (sensitive rate limiter, generic 200 response preventing enumeration)
- `POST /api/v1/auth/reset-password` (sensitive rate limiter, single-use token verification, revokes all user sessions)
- `POST /api/v1/auth/change-password` (authenticated, CSRF-protected, verifies current password, revokes other sessions & rotates current session)
- `GET /api/v1/auth/sessions` (authenticated, lists active non-expired sessions without `tokenHash`)
- `DELETE /api/v1/auth/sessions/:sessionId` (authenticated, CSRF-protected, revokes own session only)

---

## 4. RBAC & Multi-Tenant Authorization

- **Roles**: Maps Prisma `UserRole` (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) to a documented permission catalogue (`platform.*`, `school.*`, `attendance.*`, `assignments.*`, `assessments.*`, `progress.*`, `support_flags.*`, `student.*`, `parent.*`).
- **Middlewares**:
  - `authenticate`: Validates `sid` cookie -> SHA-256 lookup -> checks expiry, `User.status`, `deletedAt`, and `School.status`; populates `req.auth` (`userId`, `schoolId`, `role`, `permissions`, `sessionId`).
  - `requireCsrfHeader`: Enforces CSRF protection on state-changing cookie-authenticated endpoints.
  - `requirePermission(...)` / `requireRole(...)`: Deny-by-default authorization guards.
- **Tenant & Relationship Isolation** (Option A per `ADR-0007`, application-layer + DB composite FKs):
  - `resolveTenantSchoolId(req)` / `requireTenantMatch`: Derives `schoolId` strictly from `req.auth.schoolId`, rejecting manipulated client `schoolId` values.
  - `assertTeacherAssignedToSection` / `assertTeacherAssignedToCourse`: Verifies `CourseTeacher` / `Section` homeroom ownership.
  - `assertStudentSelf`: Restricts `STUDENT` to their own `StudentProfile`.
  - `assertVerifiedGuardian`: Restricts `PARENT` to `GuardianRelationship` rows where `isVerified === true`.

---

## 5. Security Audit Logging & Verification

- **Audit Service** (`apps/api/src/modules/audit/audit.service.ts`): Writes immutable `AuditLog` entries for login success/failure, logout, password change/reset, session revocation, account/role/school changes, and authorization denials without ever logging passwords, hashes, cookies, or tokens.
- **Verification**: Comprehensive Vitest + Supertest suites covering auth, RBAC across all 5 roles, tenant isolation, parent-child authorization, session lifecycle, CSRF, rate limiting, password recovery, audit logging, plus Phase 5 & Phase 6 regressions.
