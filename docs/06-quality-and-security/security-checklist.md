# Security Controls and Verification Checklist

This document details the mandatory security controls, hardening measures, and verification checklist that must be satisfied across all layers of the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Identity, Session & Credential Controls

- [ ] **Argon2id Password Hashing**: Verified using minimum 64 MB memory cost, 3 iterations, 4 parallelism threads.
- [ ] **Secure Session Cookie**: Cookie attributes strictly set to `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/`, and max lifetime 8 hours.
- [ ] **Zero JWT in LocalStorage**: Confirmed that client applications do not store authentication credentials in browser `localStorage` or `sessionStorage`.
- [ ] **Instant Session Invalidation**: Explicit logout immediately deletes the session record from the database.
- [ ] **Brute-Force Protection**: Sliding-window rate limiting active on `/api/v1/auth/login` (max 5 failed attempts per 15 minutes per IP/account).

---

## 2. Multi-Tenancy & Authorization Controls

- [ ] **Zero IDOR Vulnerabilities**: All database queries for tenant-owned entities filter strictly by `school_id` extracted from the verified session context.
- [ ] **Automated Tenant Isolation Tests**: 100% of API endpoints covered by automated cross-tenant security tests in CI.
- [ ] **RBAC Enforcement**: Every protected endpoint enforces explicit role verification via `requireRole(...)` middleware.
- [ ] **Super Admin Decoupling**: Platform Super Admin endpoints are separated under `/api/v1/admin/*` without default bypass privileges on educational routes.

---

## 3. Input Validation & Injection Defenses

- [ ] **Server-Side Runtime Validation**: 100% of request bodies, query strings, and path parameters validated via Zod schemas before business logic execution.
- [ ] **Zero Raw SQL Concatenation**: All database interactions execute via Prisma ORM parameterized queries; raw string concatenation in SQL is prohibited.
- [ ] **Payload Size Restrictions**: Body parser restricts incoming JSON payloads to $\le 5\text{ MB}$ to prevent memory exhaustion attacks.

---

## 4. HTTP Headers and Transport Hardening

- [ ] **Strict TLS 1.3**: All external communications enforced over HTTPS with HSTS enabled (`max-age=31536000; includeSubDomains`).
- [ ] **Content Security Policy (CSP)**: Helmet configured with strict CSP prohibiting `unsafe-inline` scripts and unauthorized external asset origins.
- [ ] **Anti-Clickjacking**: `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`) active to prevent iframe embedding.
- [ ] **MIME Sniffing Blocked**: `X-Content-Type-Options: nosniff` active on all responses.

---

## 5. Privacy, Logging & Audit Controls

- [ ] **Zero Real PII in Logs**: Pino logger configured with automated redaction filters for passwords, tokens, cookies, and student personal data.
- [ ] **Immutable Audit Logging**: Critical educational state changes (attendance overrides, grade amendments, support plan status changes) write to append-only `audit_logs`.
- [ ] **Zero Real PII in Non-Prod**: Development and CI environments populated strictly with synthetic test fixtures.
