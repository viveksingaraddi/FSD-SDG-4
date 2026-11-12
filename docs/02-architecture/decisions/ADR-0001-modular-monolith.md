# ADR-0001: Modular Monolith Architecture Pattern

- **Status**: Proposed
- **Date**: 2026-10-29
- **Deciders**: Vivek (Tech Lead), Vishwanath (Product Lead), Yashwardhan (Infra Lead), Vishwas (QA Lead)

---

## 1. Context and Problem Statement

The FSD-SDG-4 platform is an early-stage SaaS application being developed by a small team of four engineers. The application encompasses multiple complex educational domains: identity, school configuration, attendance, coursework, assessments, and structured support interventions.

We must choose an overarching system architecture that enables rapid development, simple deployment, atomic database transactions, and clear domain boundaries without incurring overwhelming operational or distributed systems overhead.

---

## 2. Decision

We will structure the backend as a **Modular Monolith** running as a single deployable Node.js process. The application will be partitioned into strict, decoupled domain modules (`identity`, `schools`, `users`, `attendance`, `coursework`, `assessments`, `support-intervention`, `audit`) residing in `backend/src/modules/`.

Rules governing the modular monolith:

1. Each domain module exposes a typed public service interface.
2. Cross-module communication occurs strictly via service method calls, not direct database queries into other modules' tables.
3. Modules share a single relational PostgreSQL database and run within the same operating system process.
4. Circular dependencies between modules are forbidden and enforced via static linting.

---

## 3. Alternatives Considered

### Alternative A: Microservices Architecture

- _Description_: Decomposing the system into independent services (Auth Service, Attendance Service, Grading Service, Support Service) with separate databases and HTTP/gRPC communication.
- _Rejection Rationale_: Massive operational complexity for a four-person engineering team. Distributed transactions across attendance and support flags would require complex saga patterns. Network latency and multi-container deployment overhead would significantly slow down feature delivery.

### Alternative B: Unstructured "Spaghetti" Monolith

- _Description_: Single repository with global controllers directly mutating all database tables with ad-hoc queries.
- _Rejection Rationale_: Leads to rapid architectural decay, high regression rates, tight coupling, and unmanageable merge conflicts among team members.

---

## 4. Benefits

- **Transactional Consistency**: Multi-entity workflows (such as updating attendance and immediately generating a support flag) execute within standard ACID database transactions.
- **Operational Simplicity**: Single build artifact, single Docker container, single CI/CD pipeline, and unified local development environment.
- **High Performance**: Zero network serialization or inter-process communication latency between domains.
- **Future Extraction Path**: Clean domain module boundaries allow individual domains (e.g. attendance engine) to be extracted into standalone microservices in the future if scale demands it.

---

## 5. Trade-offs and Consequences

- **Single Point of Failure**: A crash or unhandled out-of-memory error in one module brings down the entire application process. (Mitigated via process supervisors like PM2/Docker and thorough automated testing).
- **Discipline Required**: Developers must resist the temptation to write ad-hoc SQL joins across module boundaries. (Enforced via code reviews and linting rules).

---

## 6. Security and Operational Implications

- Unified security boundary simplifies session validation and correlation ID tracing.
- Logging, metrics, and error handling are consolidated into a single middleware pipeline.

---

## 7. Conditions for Revisit

This decision will be revisited if:

1. The engineering organization scales beyond 15 engineers with dedicated teams per domain.
2. Specific modules (e.g., real-time attendance ingestion) exhibit CPU/memory scaling profiles that require independent horizontal autoscaling.
