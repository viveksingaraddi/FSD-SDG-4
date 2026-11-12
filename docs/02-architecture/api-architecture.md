# API Architecture and Contract Standards

This document defines the RESTful API design standards, contract specifications, versioning strategy, and error response models for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. REST API Design Standards

- **Base URL & Versioning**: All API endpoints are strictly versioned under the `/api/v1` path prefix (e.g., `https://api.platform.internal/api/v1/attendance`).
- **Resource-Oriented Naming**: URI paths use plural nouns in lowercase kebab-case for resource collections (e.g., `/api/v1/course-offerings`, `/api/v1/support-plans`).
- **Standard HTTP Verbs**:
  - `GET`: Retrieve a resource or collection (idempotent, safe).
  - `POST`: Create a new resource or execute a non-idempotent action.
  - `PUT`: Replace an existing resource in its entirety.
  - `PATCH`: Apply partial updates to an existing resource.
  - `DELETE`: Remove or deactivate a resource.

---

## 2. Standardized JSON Error Format (RFC 7807 / RFC 9457)

All error responses from the API must return `Content-Type: application/problem+json` formatted according to RFC 7807 / RFC 9457 specifications. Internal database schemas or stack traces are never leaked.

```json
{
  "type": "https://api.fsd-sdg4.internal/errors/validation-failed",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "The request body failed schema validation.",
  "instance": "/api/v1/attendance/rosters",
  "invalidParams": [
    {
      "name": "records[4].status",
      "reason": "Invalid attendance status 'AWOL'. Expected one of: PRESENT, ABSENT, LATE, EXCUSED"
    }
  ],
  "correlationId": "c5f884a2-1b1e-450a-9d32-d85c829e2f5b",
  "timestamp": "2026-10-29T08:15:23Z"
}
```

### Core Error Types & HTTP Status Mapping

| HTTP Status            | Title                   | Description / Typical Trigger                                         |
| :--------------------- | :---------------------- | :-------------------------------------------------------------------- |
| **400 Bad Request**    | Malformed Request       | Syntax errors in JSON body or missing required HTTP headers.          |
| **401 Unauthorized**   | Authentication Required | Missing, expired, or invalid session cookie.                          |
| **403 Forbidden**      | Access Denied           | Authenticated user lacks permission (RBAC) or tenant ownership.       |
| **404 Not Found**      | Resource Not Found      | Target entity does not exist or belongs to a different school tenant. |
| **409 Conflict**       | State Conflict          | Duplicate unique constraint (e.g., duplicate attendance for date).    |
| **422 Unprocessable**  | Validation Error        | Payload fails Zod validation schema rules.                            |
| **429 Too Many Req**   | Rate Limit Exceeded     | Exceeded allowed requests in sliding rate-limit window.               |
| **500 Internal Error** | Server Error            | Unhandled server exception (details logged with correlation ID).      |

---

## 3. Standard Response Envelopes

### 3.1 Single Resource Response

```json
{
  "data": {
    "id": "pln_01HZY4P98Z",
    "studentId": "stu_01HZY4A11A",
    "status": "ACTIVE",
    "leadTeacherId": "usr_01HZY4BC3D",
    "targetGoal": "Achieve >= 90% attendance over next 3 weeks",
    "reviewDate": "2026-11-21T00:00:00Z",
    "createdAt": "2026-10-29T08:30:00Z"
  }
}
```

### 3.2 Collection Response with Standard Pagination

```json
{
  "data": [
    { "id": "res_01", "title": "Algebra Unit 1 Guide" },
    { "id": "res_02", "title": "Geometry Worksheet 4" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 42,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 4. OpenAPI 3.1 Specification Contracts

The API contract is maintained as code using OpenAPI 3.1. Zod schemas defined in backend modules export JSON Schema equivalents to automatically generate OpenAPI documentation, guaranteeing that runtime validation schemas and external API contracts remain 100% in sync without manual drift.
