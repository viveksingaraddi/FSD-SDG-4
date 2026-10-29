# ADR-0004: Authentication, Session Management, and Password Hashing

- **Status**: Proposed
- **Date**: 2026-10-29
- **Deciders**: Vivek (Tech Lead), Vishwas (Security/QA Lead)

---

## 1. Context and Problem Statement

Authentication mechanisms in web SaaS applications typically choose between stateless JSON Web Tokens (JWTs) stored in client browser storage or server-managed sessions backed by secure cookies. In an educational platform handling sensitive student data and operating frequently on shared public or classroom computers, session revocation speed, XSS immunity, and credential security are critical concerns.

---

## 2. Decision

We will implement **Server-Managed Sessions** stored in PostgreSQL and delivered via secure cookies:
1. **Password Hashing**: All passwords are hashed using **Argon2id** with minimum parameters $m=64\text{ MB}$, $t=3$ iterations, $p=4$ parallelism, and a unique 16-byte random salt.
2. **Session Storage**: Sessions are persisted in the `sessions` database table, containing a hashed 256-bit random session token, `user_id`, `school_id`, `created_at`, `expires_at`, and client metadata.
3. **Cookie Transport**: The session token is transmitted exclusively via an `HttpOnly`, `Secure` (production), `SameSite=Lax` cookie named `sid` with an 8-hour lifetime.
4. **Instant Revocation**: Explicit logout immediately deletes the session row from PostgreSQL, instantly invalidating all further requests even if the cookie persists on the client terminal.

---

## 3. Alternatives Considered

### Alternative A: Stateless JWTs Stored in `localStorage`
- *Rejection Rationale*: Any Cross-Site Scripting (XSS) vulnerability allows malicious scripts to extract the JWT from `localStorage`. Furthermore, stateless JWTs cannot be revoked immediately upon logout or account suspension without maintaining a stateful revocation blocklist—negating their stateless benefit.

### Alternative B: JWTs in `HttpOnly` Cookies with Refresh Tokens
- *Rejection Rationale*: Adds significant architectural complexity (dual token lifecycle, refresh token rotation, race conditions during concurrent tab requests) without meaningful benefit for a modular monolith database that can comfortably query a indexed session table.

---

## 4. Benefits

- **XSS Immunity**: `HttpOnly` cookies cannot be read or stolen by client-side JavaScript.
- **Immediate Revocation**: Logout, password reset, or admin suspension terminates active sessions immediately.
- **Shared-Device Safety**: Guaranteed session destruction when a teacher or student clicks "Sign Out" on a shared computer lab terminal.
- **Argon2id Resistance**: State-of-the-art memory-hard resistance against GPU-accelerated cracking attacks.

---

## 5. Trade-offs and Consequences

- **Database Lookups on Every Request**: Each authenticated request requires a fast indexed lookup in the `sessions` table.
  - *Mitigation*: The `sessions` table is indexed on `token_hash` (`B-Tree`). At our scale ($< 5,000$ concurrent sessions), session lookups take $< 1\text{ ms}$.

---

## 6. Conditions for Revisit

This decision will be revisited if:
1. High-frequency API traffic exceeds $20,000\text{ RPS}$, prompting the introduction of an in-memory Redis session cache.
