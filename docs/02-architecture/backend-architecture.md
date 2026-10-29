# Backend Architecture and Modular Monolith Design

This document specifies the backend architectural pattern, internal module boundaries, layering conventions, and cross-cutting concerns for the **FSD-SDG-4 Quality Education SaaS** server application.

---

## 1. Modular Monolith Pattern

The backend is architected as a **Modular Monolith** running within a single Node.js runtime process. This pattern combines the operational simplicity and transactional safety of a monolithic deployment with the strict domain boundaries and decoupled structure of microservices.

```text
backend/src/
├── app.ts                      # Express app setup, security headers, global middleware
├── server.ts                   # Process bootstrap, port binding, graceful shutdown hooks
├── config/                     # Environment configuration parsed and validated via Zod
├── middleware/                 # Cross-cutting HTTP middleware
│   ├── authenticate.ts         # Session token verification and context extraction
│   ├── requireRole.ts          # Role-Based Access Control (RBAC) guard
│   ├── tenantScope.ts          # Tenant isolation verification
│   ├── validateRequest.ts      # Zod schema validation middleware
│   ├── rateLimiter.ts          # Tiered IP / Account rate limiting
│   ├── requestLogger.ts        # Pino HTTP logger with correlation IDs
│   └── errorHandler.ts         # RFC 7807 Problem Details global exception handler
├── modules/                    # Self-contained domain modules
│   ├── identity/               # Authentication, sessions, passwords, permissions
│   ├── schools/                # Schools, academic years, classes, sections, subjects
│   ├── users/                  # Staff and student profiles, roster enrollments
│   ├── attendance/             # Daily attendance recording, bulk submission, rates
│   ├── coursework/             # Learning resources, assignments, submissions, feedback
│   ├── assessments/            # Formal exams, scoring, gradebook aggregations
│   ├── support-intervention/   # Progress snapshots, support flags, plans, reviews
│   └── audit/                  # Immutable audit log writing and querying
└── shared/                     # Shared kernel: database client, error types, utilities
    ├── db/                     # Prisma Client instance with multi-tenant extension
    ├── errors/                 # Domain error classes (AppError, NotFoundError, ForbiddenError)
    └── logger/                 # Pino logger configuration
```

---

## 2. Internal Module Layering Convention

Every domain module adheres strictly to a 3-layer architecture:

```mermaid
flowchart TD
    Req[Incoming HTTP Request] --> Ctrl[1. Controller / Route Handler<br>HTTP parameter extraction, status codes, OpenAPI schema]
    Ctrl --> Val[2. Input Validation (Zod)<br>Strict runtime payload, query, and param checking]
    Val --> Svc[3. Domain Service<br>Pure business logic, state rules, authorization checks, transactions]
    Svc --> Repo[4. Data Access Layer (Prisma)<br>Tenant-scoped queries, relational constraints]
    Repo --> DB[(PostgreSQL Database)]
```

### Layer Responsibilities
1. **Controller Layer (`*.controller.ts`, `*.routes.ts`)**:
   - Parses incoming HTTP requests, headers, and cookies.
   - Delegates payload validation to Zod schemas.
   - Extracts the authenticated `SessionContext` (`{ userId, schoolId, role }`).
   - Calls the Domain Service and maps domain results to HTTP status codes.
2. **Domain Service Layer (`*.service.ts`)**:
   - Executes business rules, state transitions, and authorization invariants.
   - Manages ACID transaction boundaries for multi-table updates.
   - Emits audit events and triggers support flag evaluations.
   - **Rule**: A service may call another module's public service interface, but **never** accesses another module's database tables directly.
3. **Data Access Layer (`*.repository.ts` or Prisma Client)**:
   - Encapsulates database queries.
   - Injects mandatory `where: { schoolId }` filters to guarantee tenant isolation.

---

## 3. Cross-Cutting Backend Middleware Pipeline

Every HTTP request traverses an ordered middleware pipeline:

```text
Request
  │
  ├── 1. Request ID Middleware (generates or forwards UUID correlation ID)
  ├── 2. Security Headers (Helmet: strict CSP, HSTS, X-Frame-Options)
  ├── 3. CORS Configuration (whitelisted institutional domains only)
  ├── 4. Cookie Parser (extracts signed session cookie)
  ├── 5. Rate Limiter (sliding-window rate limiting on sensitive routes)
  ├── 6. Pino Request Logger (logs request path, method, IP, correlation ID)
  ├── 7. Session Authenticator (resolves session from DB; populates req.sessionContext)
  ├── 8. Tenant & RBAC Guards (verifies active tenant status and role permissions)
  ├── 9. Zod Validation Middleware (validates body, params, and query schemas)
  │
  ▼ [ Controller / Domain Service Execution ]
  │
  ├── 10. Audit Logger (asynchronously records sensitive mutations)
  └── 11. Global Error Handler (catches unhandled exceptions, formats RFC 7807 JSON)
```

---

## 4. Structured Logging and Observability

- **Structured JSON**: All application logs are output as single-line JSON via **Pino** to `stdout`, ready for aggregation by cloud log collectors.
- **Correlation Tracing**: Every log entry includes:
  ```json
  {
    "level": 30,
    "time": 1793264400000,
    "pid": 1234,
    "hostname": "api-worker-1",
    "reqId": "c5f884a2-1b1e-450a-9d32-d85c829e2f5b",
    "tenantId": "sch_01HZY4A89X",
    "userId": "usr_01HZY4BC3D",
    "role": "TEACHER",
    "msg": "Attendance roster submitted for section sec_8A (32 students)"
  }
  ```
- **PII Scrubbing**: The logger configuration automatically sanitizes passwords, session cookies, and student personal identifiers from log outputs.
