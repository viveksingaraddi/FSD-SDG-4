# Pull Request Report: Hierarchical User Provisioning and Account Invitations

**Branch**: `feature/admin-portal`  
**Target**: `develop`  
**Phase / Milestone**: Admin Portal — Hierarchical User Provisioning & Account Invitations  
**Author**: Project Lead & Full-Stack Security Engineering

---

## 1. Executive Summary

This deliverable implements the end-to-end **Hierarchical User Provisioning and Secure Account Activation** workflow for the FSD-SDG-4 Quality Education SaaS platform.

### Core Governance & Authority Boundaries

1. **Super Admin**: Provisions school tenants and their initial School Administrator.
2. **School Administrator**: Provisions Teachers, Students, and Parents/Guardians strictly within their assigned school tenant boundary (`school_id`).
3. **Cross-Tenant Prevention**: Zero-trust enforcement where tenant IDs are derived exclusively from authenticated session state (`resolveTenantSchoolId(req)`), preventing IDOR or cross-school account creation.
4. **Zero Default Passwords**: Invited accounts are created in an `INACTIVE` state without default or placeholder passwords. Users must complete a cryptographic activation flow with Argon2id password hashing.

---

## 2. Security Architecture & Threat Mitigation

| Security Requirement | Implementation Detail                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Token Entropy**    | 32 cryptographically secure random bytes (`crypto.randomBytes(32).toString('hex')` -> 64 hex characters).                                                                                        |
| **Token Storage**    | Only the SHA-256 hash (`tokenHash`) is persisted in PostgreSQL; raw tokens are never logged or stored.                                                                                           |
| **Token Lifecycle**  | Finite 7-day expiration (`expiresAt = now + 7 days`). Transitions: `PENDING` -> `ACCEPTED`, `EXPIRED`, or `REVOKED`. Single-use activation.                                                      |
| **Password Hashing** | OWASP-compliant Argon2id password hashing prior to user activation.                                                                                                                              |
| **Rate Limiting**    | Strict IP and session-level rate limiting on public token verification (`/api/v1/auth/invitations/verify`) and activation (`/api/v1/auth/invitations/accept`).                                   |
| **Audit Trails**     | Complete immutable audit events: `PLATFORM_TENANT_PROVISIONED`, `TENANT_INITIAL_ADMIN_INVITED`, `USER_INVITED`, `USER_INVITATION_RESENT`, `USER_INVITATION_REVOKED`, `AUTH_INVITATION_ACCEPTED`. |

---

## 3. Database Schema & Prisma Migrations

- **Migration**: `20261113193728_phase10_user_invitations`
- **Models & Enums**:
  ```prisma
  enum InvitationStatus {
    PENDING
    ACCEPTED
    EXPIRED
    REVOKED
  }

  model UserInvitation {
    id          String           @id @default(uuid()) @db.Uuid
    schoolId    String?          @map("school_id") @db.Uuid
    userId      String           @map("user_id") @db.Uuid
    email       String           @db.VarChar(255)
    role        Role
    tokenHash   String           @unique @map("token_hash") @db.VarChar(64)
    status      InvitationStatus @default(PENDING)
    expiresAt   DateTime         @map("expires_at") @db.Timestamptz(6)
    acceptedAt  DateTime?        @map("accepted_at") @db.Timestamptz(6)
    revokedAt   DateTime?        @map("revoked_at") @db.Timestamptz(6)
    invitedById String?          @map("invited_by_id") @db.Uuid
    createdAt   DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
    updatedAt   DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

    school    School? @relation(fields: [schoolId], references: [id], onDelete: Cascade)
    user      User    @relation("UserInvitations", fields: [userId], references: [id], onDelete: Cascade)
    invitedBy User?   @relation("SentInvitations", fields: [invitedById], references: [id], onDelete: SetNull)

    @@index([schoolId, status])
    @@index([email])
    @@index([expiresAt])
    @@map("user_invitations")
  }
  ```

---

## 4. API Endpoints & Contracts

### Public Authentication Routes (`/api/v1/auth/invitations`)

- `GET /api/v1/auth/invitations/verify?token=...`: Public verification endpoint returning `{ valid: boolean, email?, role?, schoolName?, reason? }`.
- `POST /api/v1/auth/invitations/accept`: Accepts `{ token, password }`, enforces password policy, hashes password with Argon2id, activates user (`status: ACTIVE`), updates invitation to `ACCEPTED`.

### Platform Super Admin Routes (`/api/v1/super-admin`)

- Extended `POST /api/v1/super-admin/schools`: Atomically provisions School, initial School Administrator user (`INACTIVE`), and generates initial activation invitation.
- `GET /api/v1/super-admin/invitations`: Lists platform-wide invitations with status/role filtering.
- `POST /api/v1/super-admin/invitations/:id/resend`: Revokes previous invitation and issues a fresh 7-day token.
- `DELETE /api/v1/super-admin/invitations/:id`: Revokes an active invitation.

### School Admin Routes (`/api/v1/school`)

- `POST /api/v1/school/invitations`: Provisions Teacher, Student, or Parent user within tenant school, generates invitation.
- `GET /api/v1/school/invitations`: Lists tenant invitations with status/role filters.
- `POST /api/v1/school/invitations/:id/resend`: Tenant-isolated invitation reissue.
- `DELETE /api/v1/school/invitations/:id`: Tenant-isolated invitation revocation.

---

## 5. UI/UX Implementation

### A. First-Login Experience (`/accept-invitation?token=...`)

- Public page with branded education SaaS card layout.
- Real-time token validation on load with accessible feedback for expired, revoked, accepted, or invalid states.
- Dynamic password policy checklist (12+ characters, uppercase, lowercase, digit, special symbol).
- Interactive password strength meter (Weak / Fair / Good / Strong) and match verification.
- Immediate redirect to `/login` with success confirmation upon activation.

### B. Super Admin Tenant Provisioning Modal (`/super-admin/schools`)

- Added "Initial School Administrator" form section (First Name, Last Name, Email).
- On submit, provides an "Invitation Link Ready" modal with one-click copy to clipboard.

### C. School Admin User Invitations Directory (`/admin/invitations`)

- KPI Summary Cards: Total Invitations, Pending, Accepted, Expired/Revoked.
- Filter toolbar: Search by email, Filter by Status, Filter by Role.
- Responsive Data Table with status Badges and contextual actions:
  - Resend: Reissues token and surfaces copyable link.
  - Revoke: Confirms and invalidates pending invitation.
- "Invite User" Modal: Select role (Teacher, Student, Parent) and enter user details with instant invitation URL generator.

---

## 6. Quality & Verification Evidence

| Quality Gate                 | Command             | Result                                                                             |
| ---------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| **Linting**                  | `pnpm lint`         | **0 errors, 0 warnings** across all monorepo packages.                             |
| **Formatting**               | `pnpm format:check` | **All files match Prettier code style.**                                           |
| **Type Checking**            | `pnpm typecheck`    | **0 errors** across all 6 TypeScript projects.                                     |
| **Unit & Integration Tests** | `pnpm test`         | **143 tests passed** (87 API, 35 Web, 13 Validation, 4 Contracts, 4 Shared Types). |
| **Production Build**         | `pnpm build`        | **Clean build** across all packages and apps.                                      |
