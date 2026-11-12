# Security Threat Model (STRIDE Methodology)

This document formalizes the threat model for the **FSD-SDG-4 Quality Education SaaS** platform using the Microsoft STRIDE methodology. It identifies critical attack vectors and defines architectural countermeasures.

---

## 1. Threat Modeling Scope & Trust Boundaries

```text
[ Internet / Untrusted Client ]
              │
══════════════╡ Trust Boundary 1: Public Internet / TLS Reverse Proxy
              ▼
    [ Express API Gateway ]
              │
══════════════╡ Trust Boundary 2: Authenticated Application Server / Domain Services
              ▼
    [ Prisma ORM & Database Layer ]
              │
══════════════╡ Trust Boundary 3: Internal VPC Network / Relational Storage
              ▼
    [ PostgreSQL 16+ Database ]
```

---

## 2. STRIDE Threat Analysis & Architectural Countermeasures

### 2.1 Spoofing (Identity Deception)

- **Threat Scenario 1**: An attacker or malicious student steals a teacher's session token to forge grades or falsify attendance.
  - _Countermeasure_: Session tokens are stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies, preventing extraction via XSS. Sessions enforce idle timeouts (60 min) and maximum durations (8 hrs).
- **Threat Scenario 2**: Credential stuffing or brute-force dictionary attacks against teacher accounts.
  - _Countermeasure_: Argon2id password hashing + sliding-window rate limiting (max 5 failed attempts per 15 minutes per IP/account) with progressive delays and temporary lockouts.

### 2.2 Tampering (Data Modification)

- **Threat Scenario 1**: A teacher in School A attempts to tamper with the attendance records or assessment scores of School B by manipulating `id` route parameters.
  - _Countermeasure_: Multi-tenant query enforcement. The data-access layer filters all mutations by `WHERE school_id = session.school_id`. Unauthorized cross-tenant mutations fail with `404 Not Found`.
- **Threat Scenario 2**: Parameter manipulation in assignment grading (submitting negative scores or exceeding max points).
  - _Countermeasure_: Zod schema validation strictly asserts $0 \le \text{score} \le \text{max_points}$ before reaching business logic.

### 2.3 Repudiation (Denial of Action)

- **Threat Scenario 1**: An educator alters a student's grade or dismisses a critical Support Flag, later denying having performed the action.
  - _Countermeasure_: Centralized, append-only `audit_logs` table recording `user_id`, `school_id`, `action_type`, `entity_type`, `entity_id`, `before_state`, `after_state`, `ip_address`, and `timestamp`.

### 2.4 Information Disclosure (Data Leakage)

- **Threat Scenario 1**: Unauthenticated user or search engine crawler accesses sensitive student rosters, grades, or disciplinary support flags.
  - _Countermeasure_: All student and academic endpoints require valid session authentication and RBAC permissions. API endpoints return `401 Unauthorized` without credentials.
- **Threat Scenario 2**: Detailed database error messages or stack traces returned to client during server crashes, revealing table schemas.
  - _Countermeasure_: Global error handling middleware intercepts all errors, logging raw details to secure server logs via Pino while returning standardized RFC 7807 JSON errors without internal details.

### 2.5 Denial of Service (DoS)

- **Threat Scenario 1**: Coordinated flood of large file uploads during assignment submission deadlines exhausts server disk space or memory.
  - _Countermeasure_: Maximum request payload size limit ($5\text{ MB}$); binary files uploaded directly to S3-compatible cloud storage via short-lived pre-signed URLs; Express connection rate limiting.
- **Threat Scenario 2**: Heavy aggregation queries (school-wide gradebook calculation) called repeatedly to lock PostgreSQL CPU.
  - _Countermeasure_: Rate limiting on analytical endpoints, optimized database composite indexing, and query execution timeouts ($5,000\text{ ms}$).

### 2.6 Elevation of Privilege

- **Threat Scenario 1**: A Student or Teacher manipulates client cookies or API request bodies to assume `SCHOOL_ADMIN` or `SUPER_ADMIN` status.
  - _Countermeasure_: Role assignments are stored exclusively in the server-side database `users` and `sessions` tables. Client requests have zero control over session role attributes. All administrative routes enforce `requireRole('SCHOOL_ADMIN')` or `requireRole('SUPER_ADMIN')`.
