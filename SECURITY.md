# Security Policy: FSD-SDG-4 Quality Education SaaS

Security and student data privacy are core architectural imperatives of the FSD-SDG-4 platform. This document outlines our vulnerability disclosure policy, baseline security controls, tenant isolation principles, and threat mitigation models.

---

## 1. Reporting Security Vulnerabilities

We welcome responsible security disclosures from researchers, developers, and users.

- **Primary Contact**: `security@fsd-sdg4-platform.internal` (and engineering lead Vivek)
- **Encryption**: Security communications should be signed or encrypted where sensitive.
- **Response Timeline**:
  - Initial acknowledgement: Within 24 hours.
  - Triage & preliminary assessment: Within 48 hours.
  - Critical patch delivery: Target 72 hours for high/critical vulnerabilities.
- **Safe Harbor**: Security researchers acting in good faith who avoid data destruction, respect user privacy, and do not violate laws will receive safe harbor.

---

## 2. Core Architectural Security Principles

### Multi-Tenant Isolation

The platform operates as a shared-database, shared-schema SaaS partitioned by institutional tenant (`school_id`).

1. **Application-Layer Enforcement**: Every query touching tenant data MUST include explicit `where: { schoolId }` filters derived exclusively from verified session tokens.
2. **PostgreSQL Defense in Depth**: RLS policies evaluate tenant boundaries at the database layer.
3. **No Insecure Direct Object References (IDOR)**: Entities must never be updated or fetched solely by surrogate primary keys (`id`) without verifying tenant ownership.

### Authentication & Credential Management

1. **Password Hashing**: Passwords must be hashed using **Argon2id** with calibrated memory and time parameters (e.g., minimum 64MB memory, 3 iterations, 4 parallelism).
2. **Session Security**:
   - Sessions are server-managed with random, cryptographically secure 256-bit identifiers stored in the database.
   - Session identifiers are transmitted exclusively via `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` where appropriate) cookies.
   - JWT tokens stored in browser `localStorage` or `sessionStorage` are strictly prohibited due to XSS vulnerability.
3. **Rate Limiting**: Tiered rate limiting applied to authentication endpoints (e.g., maximum 5 failed attempts per IP/account window) with progressive backoff.

### Cross-Site Scripting (XSS) & Injection Defenses

1. **Runtime Input Validation**: Strict validation schemas (Zod) enforced on all request bodies, parameters, and headers before passing to business logic.
2. **Database Queries**: All database interactions are executed through parameterized queries (Prisma ORM) to prevent SQL injection.
3. **Content Security Policy (CSP)**: Restrictive HTTP security headers configured via Helmet to prevent inline script execution and unauthorized asset fetching.

### Cross-Site Request Forgery (CSRF)

1. **Protection Mechanism**: In addition to `SameSite=Lax` cookie flags, state-changing HTTP operations (POST, PUT, PATCH, DELETE) require a cryptographically verified anti-CSRF token or custom header (`X-Requested-With`) validated against the session context.

### Data Protection & Student Privacy

1. **Zero Real PII in Development**: No real student or educational records may be stored in lower environments (development, test, staging) or automated test fixtures. All test fixtures must use synthetic generators.
2. **Encryption in Transit**: Strict TLS 1.3 enforcement for all external client-to-server and internal server-to-database communications.
3. **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced across Super Admin, School Admin, Teacher, Student, and Parent roles.

---

## 3. Threat Model Overview

The full threat modeling analysis using the STRIDE methodology is documented in [docs/02-architecture/security-threat-model.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/security-threat-model.md).

| Threat Category            | Primary Risk in Education SaaS                                    | Primary Architectural Mitigation                                                                       |
| :------------------------- | :---------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Spoofing**               | Student impersonating teacher to grade assignments.               | Secure server-managed sessions, cryptographically signed cookies, role verification on every endpoint. |
| **Tampering**              | Modifying attendance or assessment results across tenants.        | Multi-tenant query filtering, immutable audit logs for grade alterations, database constraints.        |
| **Repudiation**            | Denying issuance of student support interventions or grade edits. | Comprehensive, append-only audit trail capturing user ID, tenant ID, timestamp, and action delta.      |
| **Information Disclosure** | Cross-tenant student record leakage (grades, support flags).      | Mandatory tenant isolation in data access layer, automated tenant boundary testing in CI.              |
| **Denial of Service**      | Flooding assessment submission endpoints during final exams.      | Tiered IP and tenant rate limiters, payload size limits, connection pooling.                           |
| **Elevation of Privilege** | School administrator attempting platform-wide super admin tasks.  | Strict separation of Platform Admin and Tenant Admin roles, distinct API route hierarchies.            |
