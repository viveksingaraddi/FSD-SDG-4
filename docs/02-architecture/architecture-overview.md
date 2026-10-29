# System Architecture Overview

## 1. Architectural Philosophy and Design Principles

The **FSD-SDG-4 Quality Education SaaS** architecture is engineered around the principle of **sustainable simplicity**: creating a robust, secure, accessible, and high-velocity foundation tailored for a small, focused engineering team.

Key foundational tenets:
1. **Modular Monolith First**: A single, unified backend application structured into decoupled, domain-bounded modules. We reject premature distributed microservices complexity in favor of transactional consistency, simple debugging, and unified deployment.
2. **Tenant Isolation by Design**: Multi-tenancy is not an afterthought or a simple `WHERE` clause check. It is an end-to-end architectural invariant enforced at the API gateway, session layer, domain service boundary, and database query tier.
3. **Defense in Depth**: Security controls operate across multiple independent boundaries (secure cookies, rate limiting, Zod validation, RBAC middleware, ORM query extensions, and potential database RLS).
4. **Resilient User Experience**: The frontend Single Page Application (SPA) is built mobile-first, designed for low-bandwidth networks, and optimized for WCAG 2.2 Level AA accessibility.
5. **Human-in-the-Loop Interventions**: The technical architecture explicitly enforces human review workflows for student support flags, guaranteeing that algorithmic triggers remain purely advisory.

---

## 2. High-Level Architectural Blueprint

The system follows a standard three-tier cloud SaaS topology:

```text
[ Client Tier ]                [ Application Tier ]                 [ Data Tier ]
React 18+ SPA (Vite)  <====>  Express Modular Monolith  <=======>  PostgreSQL 16+
Tailwind CSS + Query           REST API (/api/v1)                   Shared Schema
Mobile / Desktop               Zod Validation + Pino                Prisma ORM
```

- **Client Tier**: A responsive React SPA compiled with Vite, styled with Tailwind CSS, utilizing accessible headless primitives, managed with React Router v6+, and powered by TanStack Query for server-state caching and synchronization.
- **Application Tier**: A modular Node.js/Express service written in strict TypeScript. The application is partitioned into clear domain modules (`identity`, `schools`, `academics`, `attendance`, `coursework`, `support-intervention`, `audit`) with strict public interfaces.
- **Data Tier**: A relational PostgreSQL database employing a shared-database, shared-schema multi-tenancy model partitioned by `school_id`. Data access is managed via Prisma ORM with explicit transaction boundaries, foreign key constraints, and multi-tenant query isolation extensions.

---

## 3. Technology Stack Summary (Proposed Baseline)

| System Layer | Selected Technology | Version / Tooling | Rationale & ADR Reference |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 18+ | Declarative component model, rich ecosystem, accessibility tooling. |
| **Build & Dev Tooling** | Vite | 5+ | Ultra-fast HMR, optimized tree-shaking, minimal bundle overhead. |
| **Language & Typings** | TypeScript | 5+ (Strict) | Compile-time type safety across frontend and backend domains. |
| **Styling & Design System** | Tailwind CSS + Headless UI | Modern | Mobile-first utility design system with strict accessible tokens. |
| **Client State / Fetching** | TanStack Query | v5 | Automated cache invalidation, background refetching, offline resiliency. |
| **Forms & Validation** | React Hook Form + Zod | Modern | Performant, un-opinionated form state with isomorphic Zod validation schemas. |
| **Backend Runtime** | Node.js | LTS (v20+) | Event-driven, non-blocking I/O ideal for RESTful JSON APIs. |
| **Web Application Server** | Express | 4.x / 5.x | Mature, un-opinionated, lightweight HTTP routing and middleware framework. |
| **API Contract & Format** | RESTful `/api/v1` | OpenAPI 3.1 | Standardized versioned endpoints with RFC 7807 structured error responses. |
| **Structured Logging** | Pino | 8+ | High-performance JSON logger with correlation IDs (`requestId`, `tenantId`). |
| **Database Engine** | PostgreSQL | 16+ | ACID relational integrity, powerful JSONB/indexing, multi-tenant safety. |
| **ORM / Data Access** | Prisma ORM | 5+ | Type-safe query generation, migration management, query extensions. |
| **Testing Harness** | Vitest, Supertest, Playwright | Modern | Unified unit, integration, and browser end-to-end testing matrix. |

---

## 4. Key Cross-Cutting Architectural Concerns

1. **Identity & Multi-Tenancy**: The session context extracted from HttpOnly cookies carries `{ userId, schoolId, role }`. Every downstream domain service receives this verified context and automatically scopes all database operations to `schoolId`.
2. **Error Handling**: Centralized error middleware intercepts all exceptions and serializes them into standardized RFC 7807 `application/problem+json` envelopes. Internal stack traces and database schema specifics are strictly hidden from clients.
3. **Auditability**: Sensitive academic modifications (grades, attendance edits, support plan status changes) write immutable audit entries via an asynchronous audit queue.
4. **Performance & Caching**: Cache-Control headers for static assets, database connection pooling via PgBouncer/Prisma, and targeted composite indexes on high-frequency tenant queries.
