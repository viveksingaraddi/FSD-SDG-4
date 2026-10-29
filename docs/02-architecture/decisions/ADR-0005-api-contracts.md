# ADR-0005: REST API Contracts, Runtime Validation, and Error Standards

- **Status**: Proposed
- **Date**: 2026-10-29
- **Deciders**: Vivek (Tech Lead), Vishwanath (Product/Frontend Lead)

---

## 1. Context and Problem Statement

A multi-tenant SaaS requires unambiguous, predictable communication between client applications and backend domain services. Inconsistent API response formats, ad-hoc error messages, and undocumented endpoints create friction, regressions, and security vulnerabilities. We need a standardized API contract, validation strategy, and error response structure.

---

## 2. Decision

We will implement a **Versioned REST API** (`/api/v1`) governed by the following standards:
1. **Runtime Validation via Zod**: All inbound request payloads (JSON bodies, query parameters, path variables) must be validated against explicit Zod schemas before being passed to domain controllers.
2. **OpenAPI 3.1 Integration**: OpenAPI documentation is derived from or aligned with the Zod schemas, maintaining 100% synchronization between contract and code.
3. **Standardized Error Envelopes (RFC 7807 / RFC 9457)**: All 4xx and 5xx errors return `application/problem+json` envelopes detailing `type`, `title`, `status`, `detail`, `instance`, `invalidParams`, and `correlationId`.
4. **No Internal Leakage**: Database error messages and server stack traces are logged internally via Pino with correlation IDs, but are never transmitted to clients in production.

---

## 3. Alternatives Considered

### Alternative A: GraphQL
- *Rejection Rationale*: While GraphQL allows flexible client queries, it introduces significant complexity around fine-grained authorization, caching, rate limiting, and query depth/complexity attacks. In a multi-tenant application where every query must enforce strict `school_id` isolation, RESTful endpoints provide clear, auditable authorization boundaries.

### Alternative B: gRPC / tRPC
- *Rejection Rationale*: tRPC tightly couples full-stack TypeScript codebases and does not provide language-agnostic OpenAPI contracts. Standard REST `/api/v1` ensures clean decoupling and allows external mobile or third-party client integrations in the future.

---

## 4. Benefits

- **Predictable Error Handling**: Client applications can reliably parse field-level validation errors to display inline form errors.
- **Fail-Fast Security**: Malformed or unwhitelisted parameters are rejected at the HTTP boundary before consuming database or business logic resources.
- **Contract Traceability**: Automated API tests in Supertest validate responses against the OpenAPI schema.

---

## 5. Conditions for Revisit

This decision will be revisited if:
1. Advanced mobile offline synchronization requires a binary protocol (e.g., Protobuf/gRPC).
