# Authentication and Authorization Architecture

This document defines the identity management, password hashing, session lifecycle, role-based access control (RBAC), and tenant authorization mechanisms for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Authentication Architecture: Server-Managed Sessions

To maximize security, simplify revocation, and eliminate client-side token exposure (e.g. XSS vulnerabilities associated with JWTs stored in `localStorage`), the platform adopts **Server-Managed Sessions**:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser / Mobile
    participant API as Express API Server
    participant DB as PostgreSQL Database

    User->>API: POST /api/v1/auth/login { email, password }
    API->>DB: Query User by email
    DB-->>API: User record (with password_hash)
    API->>API: Verify password with Argon2id
    API->>DB: Insert new Session record (random 256-bit ID, expiry, schoolId, userId)
    DB-->>API: Session created
    API-->>User: 200 OK + Set-Cookie: sid=<token>; HttpOnly; Secure; SameSite=Lax; Path=/

    Note over User,API: Subsequent Authenticated Requests
    User->>API: GET /api/v1/attendance/rosters (Cookie: sid=<token>)
    API->>DB: Lookup Session by sid & verify not expired
    DB-->>API: Valid SessionContext { userId, schoolId, role }
    API->>API: Execute business logic scoped to schoolId
    API-->>User: 200 OK { data: [...] }
```

### 1.1 Password Security (Argon2id)

All user passwords must be hashed using the **Argon2id** algorithm (RFC 9106) with calibrated parameters:

- **Algorithm**: Argon2id
- **Memory Cost ($m$)**: Minimum 64 MB ($65,536\text{ KB}$)
- **Time Cost ($t$)**: Minimum 3 iterations
- **Parallelism ($p$)**: 4 parallel threads
- **Salt**: 16 bytes of cryptographically secure random bytes generated per password.

### 1.2 Session Cookie Configuration

- **Name**: `__Host-sid` (or `sid` in development).
- **Attributes**:
  - `HttpOnly`: Prevents client-side JavaScript access via `document.cookie` (immune to XSS token theft).
  - `Secure`: Transmitted strictly over HTTPS in production.
  - `SameSite=Lax`: Mitigates Cross-Site Request Forgery (CSRF) on cross-origin requests.
  - `Path=/`: Valid across all API and SPA routes.
  - `Max-Age`: 8 hours ($28,800\text{ seconds}$).

---

## 2. Role-Based Access Control (RBAC) Matrix

The system implements strict role-based access control. Permissions are verified on every protected API endpoint via `requireRole(...)` middleware:

| Permission / Action                    |  Super Admin  |    School Admin    |       Teacher        |       Student       | Parent (P1)  |
| :------------------------------------- | :-----------: | :----------------: | :------------------: | :-----------------: | :----------: |
| **Manage Global School Tenants**       |   **CRUD**    |         —          |          —           |          —          |      —       |
| **Configure Academic Years & Classes** |       —       |      **CRUD**      |         Read         |        Read         |      —       |
| **Manage Staff Profiles**              |       —       |      **CRUD**      |          —           |          —          |      —       |
| **Manage Student Profiles & Rosters**  |       —       |      **CRUD**      |         Read         |          —          |      —       |
| **Record Daily Section Attendance**    |       —       |   Update (Audit)   | **Create / Update**  |          —          |      —       |
| **View Student Attendance Records**    |       —       |    School-wide     |   Assigned Classes   |     Own Record      | Linked Child |
| **Publish Learning Resources**         |       —       |         —          |       **CRUD**       |        Read         |     Read     |
| **Publish Assignments & Tests**        |       —       |         —          |       **CRUD**       |          —          |      —       |
| **Submit Assignment Coursework**       |       —       |         —          |          —           | **Create / Update** |      —       |
| **Grade Submissions & Input Scores**   |       —       |         —          | **Create / Update**  |          —          |      —       |
| **View Academic Grades & Feedback**    |       —       |    School-wide     |   Assigned Classes   |     Own Record      | Linked Child |
| **Review / Confirm Support Flags**     |       —       |   Read / Confirm   | **Review / Confirm** |          —          |      —       |
| **Author & Review Support Plans**      |       —       | Approve / Escalate |    **CRUD Lead**     |     View Goals      |  View Goals  |
| **View Audit Logs**                    | Platform-wide |   School Tenant    |          —           |          —          |      —       |

---

## 3. Explicit Multi-Tenant Scoping (Zero Trust)

Authenticating the user's role is necessary but **not sufficient**. The API must verify tenant ownership on every request:

1. **Context Population**: The authentication middleware extracts `{ userId, schoolId, role }` from the active session.
2. **Path Parameter Validation**: If an endpoint includes an explicit `:schoolId` route parameter, the middleware asserts that `req.sessionContext.schoolId === req.params.schoolId` (unless the caller is a `SUPER_ADMIN`).
3. **Implicit ORM Scoping**: All database queries automatically filter by `req.sessionContext.schoolId`. Insecure Direct Object Reference (IDOR) attacks attempting to query an entity by its surrogate `id` without verifying `schoolId` result in an immediate `404 Not Found` response.
