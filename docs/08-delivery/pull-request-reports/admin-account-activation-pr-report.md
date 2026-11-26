# Pull Request Report: Account Activation and First Login System

**Branch**: `feature/admin-portal`  
**Target**: `develop`  
**Phase / Milestone**: Task 8 — Account Activation & First Login System  
**Author**: Project Lead & Authentication Security Architect  
**Status**: Ready for Pull Request

---

## 1. Executive Summary

This deliverable completes **Task 8: Account Activation and First Login System** across all five platform roles:

1. **Platform Super Admin** (`SUPER_ADMIN`)
2. **School Administrator** (`SCHOOL_ADMIN`)
3. **Teacher** (`TEACHER`)
4. **Student** (`STUDENT`)
5. **Parent / Guardian** (`PARENT`)

The implementation guarantees zero plaintext passwords, single-use cryptographic invitation tokens, robust Argon2id password setup, atomic account activation, and role-aware first login routing with strict session and cookie security (`__Host-sid`, `HttpOnly`, `SameSite=Lax`).

---

## 2. Key Architecture & Security Specifications

### 2.1 Invitation Acceptance & Token Verification

- **Endpoint**: `GET /api/v1/auth/invitations/verify?token=...`
- **Entropy & Cryptography**: 32-byte hex entropy (`crypto.randomBytes(32)`). Tokens are checked against the stored SHA-256 hash. Raw tokens are never logged or persisted.
- **Security Invariants**:
  - Validates token presence, format, and database existence.
  - Returns explicit, safe status codes (`EXPIRED`, `REVOKED`, `ACCEPTED`, `INVALID`, `NOT_FOUND`).
  - Asserts that the associated educational institution tenant is in `ACTIVE` status; suspended/inactive school tokens return `valid: false, reason: 'INVALID'`.
  - Zero browser trust: role and school tenancy are derived exclusively from the verified server-side invitation record.

### 2.2 Password Setup & Policy Enforcement

- **Form Controls**:
  - Interactive password setup form with real-time strength meter (0–100%) and criteria checklist.
  - Visibility toggles for both new password and confirmation password fields.
  - Policy enforcement: minimum 12 characters, uppercase, lowercase, digit, and special symbol.
  - Client-side confirmation match check with accessible aria labels and live error messaging.

### 2.3 Account Activation

- **Endpoint**: `POST /api/v1/auth/invitations/accept`
- **Atomic Transaction**:
  - Checks token validity and school tenant status.
  - Hashes user password with RFC 9106 Argon2id.
  - Atomically updates `User` status to `ACTIVE` and sets `passwordHash`.
  - Atomically marks `UserInvitation` status to `ACCEPTED` and sets `acceptedAt: now()`.
  - Records an immutable audit log entry: `AUTH_INVITATION_ACCEPTED`.
  - Rejection with `400 Bad Request` if token was already redeemed, revoked, or expired.

### 2.4 First Login & Role-Aware Routing

- **Pre-fill & Success Feedback**: Upon successful activation, user is navigated to `/login` with pre-filled institutional email and a dismissible activation confirmation banner.
- **Login Invariants**:
  - Rejects inactive or suspended accounts (`user.status !== 'ACTIVE'`) with generic `401 Unauthorized` ("Invalid email or password.") to prevent user account enumeration.
  - Automatically generates an opaque, high-entropy session token stored in PostgreSQL as SHA-256 hash.
  - Emits `__Host-sid` cookie with `HttpOnly; Secure; SameSite=Lax; Path=/`.
  - Returns authenticated user payload with assigned role and granular permission bitmask.
- **Canonical Portal Routing**:
  - `SUPER_ADMIN` &rarr; `/super-admin` (`/super-admin/dashboard`)
  - `SCHOOL_ADMIN` &rarr; `/admin` (`/admin/dashboard`)
  - `TEACHER` &rarr; `/teacher` (`/teacher/*`)
  - `STUDENT` &rarr; `/student` (`/student/*`)
  - `PARENT` &rarr; `/parent` (`/parent/*`)

---

## 3. Automated Test Coverage

### 3.1 Backend Tests (`apps/api`)

- `apps/api/src/modules/invitations/invitation.service.test.ts`:
  - `verifyInvitation` pending valid token verification with school name and role.
  - `verifyInvitation` returns `ACCEPTED`, `REVOKED`, `EXPIRED`, `NOT_FOUND`, and `INVALID` (for suspended schools).
  - `acceptInvitation` successful activation, Argon2id hashing, and audit log persistence.
  - `acceptInvitation` rejects already accepted, expired, or inactive school invitations with `BadRequestError`.
- `apps/api/src/modules/auth/auth.activation.test.ts`:
  - `GET /api/v1/auth/invitations/verify` route contracts, validation, and status responses.
  - `POST /api/v1/auth/invitations/accept` route validation and successful activation.
  - `POST /api/v1/auth/login` unactivated account rejection (401), activated login, cookie headers, and all 5 platform roles.

### 3.2 Frontend Tests (`apps/web`)

- `apps/web/src/features/auth/AcceptInvitationPage.test.tsx`:
  - Missing token error state.
  - Expired, revoked, and already-accepted invitation visual card states.
  - Password setup validation, real-time checklist, and activation submission.
- `apps/web/src/features/auth/AuthContext.test.tsx`:
  - Role home path mapping for all 5 roles.
  - Activation success banner and email prefill on `/login`.
  - Cookie-backed login and role-aware routing for `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, and `PARENT`.
  - Disallowed role redirection to `/unauthorized`.

---

## 4. Quality Gates Verification

| Verification Item    | Command                            | Result                           |
| :------------------- | :--------------------------------- | :------------------------------- |
| **Backend Tests**    | `pnpm --filter @fsd-sdg4/api test` | 13 test files, 111 passed (100%) |
| **Frontend Tests**   | `pnpm --filter @fsd-sdg4/web test` | 10 test files, 37 passed (100%)  |
| **Type Check**       | `pnpm typecheck`                   | Passed (0 errors)                |
| **Linting**          | `pnpm lint`                        | Passed (0 errors)                |
| **Formatting**       | `pnpm format:check`                | Passed (0 errors)                |
| **Production Build** | `pnpm build`                       | All packages built successfully  |
