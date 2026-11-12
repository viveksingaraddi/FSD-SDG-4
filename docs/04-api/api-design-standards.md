# REST API Design Standards

This document establishes the uniform RESTful API conventions, naming patterns, HTTP verb semantics, and request/response serialization rules for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Architectural Conventions

1. **Path Prefix**: All public API endpoints are prefixed with `/api/v1` to support seamless evolutionary versioning.
2. **Resource Naming**:
   - Collections are lowercase plural nouns in kebab-case (e.g., `/api/v1/course-offerings`, `/api/v1/support-plans`).
   - Specific entity instances are addressed by surrogate UUID: `/api/v1/assignments/:assignmentId`.
   - Nested sub-resources express natural hierarchical ownership: `/api/v1/assignments/:assignmentId/submissions`.
   - Non-CRUD procedural actions use explicit verbs as terminal path segments: `/api/v1/support-flags/:flagId/confirm`.
3. **Payload Casing**:
   - URL parameters and query keys use camelCase: `?page=1&academicYearId=...`.
   - JSON request bodies and response envelopes use standard `camelCase`.
   - Enum values are serialized as uppercase snake case: `"status": "IN_PROGRESS"`.

---

## 2. HTTP Method Semantics

| HTTP Verb  | Idempotent? |  Safe?  | Usage & Semantics                                                  |   Typical Success Code    |
| :--------- | :---------: | :-----: | :----------------------------------------------------------------- | :-----------------------: |
| **GET**    |   **Yes**   | **Yes** | Read single entity or collection query. Zero side effects.         |         `200 OK`          |
| **POST**   |     No      |   No    | Create a new entity or trigger an action (e.g. submit attendance). | `201 Created` or `200 OK` |
| **PUT**    |   **Yes**   |   No    | Replace an entire entity representation in full.                   |         `200 OK`          |
| **PATCH**  |     No      |   No    | Apply partial modifications to specific entity fields.             |         `200 OK`          |
| **DELETE** |   **Yes**   |   No    | Soft-delete, deactivate, or purge an entity.                       |     `204 No Content`      |

---

## 3. Headers and Content Negotiation

- **Request Headers**:
  - `Content-Type: application/json` (mandatory for POST/PUT/PATCH).
  - `Accept: application/json`
  - `X-Request-Id: <UUID>` (optional; generated automatically if omitted).
- **Response Headers**:
  - `Content-Type: application/json; charset=utf-8` (or `application/problem+json` on errors).
  - `X-Request-Id: <UUID>` (echoes correlation ID).
  - `Cache-Control: no-store` (for authenticated dynamic tenant endpoints).
