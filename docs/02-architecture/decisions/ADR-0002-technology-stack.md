# ADR-0002: Core Technology Stack Selection

- **Status**: Proposed
- **Date**: 2026-10-29
- **Deciders**: Vivek (Tech Lead), Vishwanath (Product/Frontend Lead), Yashwardhan (Infra Lead), Vishwas (QA Lead)

---

## 1. Context and Problem Statement

The FSD-SDG-4 platform requires a modern, productive, type-safe, and performant technology stack across frontend, backend, data layer, and quality assurance. The stack must support mobile-first responsiveness, WCAG 2.2 AA accessibility, strict multi-tenant data isolation, and low-bandwidth resilience while maintaining high engineering velocity for a small team.

---

## 2. Decision

We adopt the following technology stack baseline:

- **Frontend**: React 18+, TypeScript (strict mode), Vite, Tailwind CSS, TanStack Query (React Query v5), React Router v6+, React Hook Form, Zod.
- **Backend**: Node.js (LTS), Express 4.x/5.x, TypeScript (strict mode), Pino structured logging, Zod validation schemas.
- **Data Layer**: PostgreSQL 16+, Prisma ORM, version-controlled schema migrations.
- **Testing & Quality**: Vitest (unit/integration), Supertest (HTTP API), React Testing Library (accessible component testing), Playwright (end-to-end browser workflows).

---

## 3. Alternatives Considered

### Alternative A: Full-Stack Next.js (App Router)

- _Rejection Rationale_: Next.js App Router couples frontend rendering with backend server actions. In a multi-tenant SaaS with complex role-based authorization and session state, separating the client SPA from an explicit REST API server provides cleaner architectural boundaries, predictable session cookie handling, and independent horizontal scaling.

### Alternative B: Python / Django or FastAPI

- _Rejection Rationale_: While Django has strong built-in administration, adopting Python would split language proficiency across TypeScript on the frontend and Python on the backend. A unified TypeScript stack allows shared Zod validation schemas, unified type definitions, and fungible code reviews across the entire team.

---

## 4. Benefits

- **End-to-End Type Safety**: Shared TypeScript definitions and Zod schemas between client forms and server endpoints eliminate API payload mismatch bugs.
- **Blazing Fast Developer Velocity**: Vite provides near-instantaneous HMR, while Vitest provides rapid test feedback without Jest's transpilation overhead.
- **Relational Rigor**: PostgreSQL provides battle-tested ACID transactions, foreign keys, and indexing essential for institutional student records.
- **Accessibility & Styling Control**: Tailwind CSS paired with unstyled headless primitives allows custom, high-contrast, WCAG 2.2 AA compliant UI design without fighting third-party CSS opinionation.

---

## 5. Trade-offs and Consequences

- **Express Middleware Discipline**: Express does not enforce architectural structure out-of-the-box like NestJS or Rails; our modular monolith conventions must be strictly maintained.
- **Prisma Connection Pooling**: High concurrency requires careful configuration of connection pooling (e.g. PgBouncer) to prevent database connection exhaustion.

---

## 6. Conditions for Revisit

This decision will be revisited if:

1. React Server Components or SSR become strictly required for SEO (unlikely for an authenticated internal SaaS).
2. Advanced analytical reporting requires specialized polyglot persistence (e.g. ClickHouse for massive telemetry).
