# FSD-SDG-4: Quality Education SaaS

> **CURRENT PHASE STATUS: PHASE 4 COMPLETED — PHASE 5 AWAITING AUTHORIZATION**  
> This repository has completed **Phase 4: Repository Scaffolding and Development Environment**.  
> The `pnpm` monorepo foundation (`apps/web`, `apps/api`, `packages/*`), CI quality gates, and foundational test suites are established.  
> Database schema creation (Phase 5) and business/auth implementation remain locked until authorized.

---

## 1. Product Overview

**FSD-SDG-4 Quality Education SaaS** is a multi-tenant cloud platform engineered to support educational institutions in operationalizing United Nations Sustainable Development Goal 4 (Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all).

Rather than serving merely as a disconnected administrative record-keeping system, the platform establishes a closed-loop pedagogical and pastoral care lifecycle:

$$\text{RECORD} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{FLAG} \longrightarrow \text{SUPPORT} \longrightarrow \text{REVIEW}$$

The central mission of the platform is to bridge routine academic activities (attendance, course offerings, assignments, grading, assessments) with timely, explainable, and human-reviewed student support interventions.

### Target Personas & Core Roles

1. **Platform Super Admin**: Platform-wide tenant onboarding, school lifecycle management, cross-tenant security monitoring, and global configuration.
2. **School Administrator**: Tenant setup, academic year management, classes, sections, subjects, staff and student onboarding, and school-wide reporting.
3. **Teacher**: Attendance recording, resource curation, assignment publishing, assessment grading, student progress observation, and initiating student support flags/plans.
4. **Student**: Mobile-first dashboard, resource access, assignment submission, assessment feedback review, and progress visibility.
5. **Parent / Guardian (P1)**: Student progress visibility, attendance notifications, feedback review, and intervention consultation.

---

## 2. Current Project Status

- **Current Phase**: `PHASE 4: Repository Scaffolding and Development Environment`
- **Phase Status**: Completed (All Phase 4 Monorepo, Tooling, CI & Foundational Test Deliverables Verified)
- **Next Authorized Phase**: `PHASE 5: Database Schema & Migrations` (Pending formal user approval)
- **Active Code Base**: Minimal Phase 4 monorepo scaffolding in `apps/web`, `apps/api`, and `packages/*` (zero Prisma schema, auth, or domain logic; see [phase-4-scaffolding-report.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/phase-4-scaffolding-report.md) and [local-development-guide.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/07-devops/local-development-guide.md))

For live tracking of phase progress, open decisions, and risk registers, see [PROJECT_STATUS.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/PROJECT_STATUS.md) and [docs/08-delivery/implementation-status.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/implementation-status.md).

---

## 3. Technology Architecture Baseline (Phase 4 Active Stack)

| Tier                      | Installed / Target Technology                                           | Justification & Architectural Role                                                                                           |
| :------------------------ | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**              | React 19 (`19.3.1`), TypeScript 5.9 (`strict`), Vite 8, Tailwind CSS v4 | High-performance SPA, mobile-first responsive design, strict type safety, fast build cycles. Accessible headless primitives. |
| **State & Data Fetching** | TanStack Query v5, React Hook Form v7, Zod v4                           | Server-state caching and synchronization, performant schema-validated client-side forms.                                     |
| **Client Routing**        | React Router v7 (`7.18.5`)                                              | Role-guarded client routes with layout nesting for multi-tenant portal separation.                                           |
| **Backend Runtime**       | Node.js (`>=20.0.0`), Express 5 (`5.3.0`), TypeScript 5.9               | Modular monolith architecture, predictable async I/O, domain-driven module structure.                                        |
| **API Contract**          | Versioned REST (`/api/v1`), OpenAPI 3.1, Zod                            | Type-safe runtime input validation, strict request/response contracts, RFC 7807 Problem Details.                             |
| **Data Layer (Phase 5)**  | PostgreSQL 16+, Prisma ORM                                              | Relational integrity, ACID transaction boundaries, explicit foreign keys, indexing, and strict schema migrations.            |
| **Tenancy Model**         | Shared Database, Shared Schema (`school_id` partitioning)               | Operational efficiency for initial SaaS footprint, enforced at data-access layer with defense-in-depth RLS evaluation.       |
| **Identity & Sessions**   | Server-Managed Sessions, HttpOnly/Secure/SameSite Cookies               | Resilient against XSS token theft, instant session revocation, Argon2id password hashing, RBAC (Phases 6–7).                 |
| **Observability**         | Pino Structured Logging (`10.4.0`), Healthchecks                        | JSON logging with correlation IDs (`requestId`), graceful shutdown, container readiness.                                     |
| **Testing Suite**         | Vitest 5, Supertest 7, React Testing Library 16, Playwright 1.64        | Comprehensive unit, integration, API contract, tenant isolation, and browser end-to-end testing.                             |

---

## 3A. Teammate Setup & Dependency Installation

This repository is a **Node.js + `pnpm` TypeScript monorepo**. Dependencies are declared in [`package.json`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/package.json) (and each workspace's `package.json` under `apps/*` and `packages/*`) and pinned in [`pnpm-lock.yaml`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/pnpm-lock.yaml).

### 1. Prerequisites

- **Node.js** `>= 20.0.0` (LTS; see [`.nvmrc`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/.nvmrc) — run `nvm use` if using `nvm`)
- **pnpm** `10.34.6` (recommended via Corepack)

```bash
corepack enable
corepack prepare pnpm@10.34.6 --activate
```

### 2. Clone & Install All Workspace Dependencies

```bash
git clone https://github.com/viveksingaraddi/FSD-SDG-4.git
cd FSD-SDG-4
pnpm install --frozen-lockfile
```

To run browser E2E tests locally, install Playwright's Chromium binary once:

```bash
pnpm --filter '@fsd-sdg4/web' exec playwright install chromium
```

### 3. Configure Local Environment Variables

Copy the placeholder templates (never commit `.env` files):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Common Monorepo Commands

```bash
pnpm dev                # Start both apps/web (Vite) and apps/api (tsx watch)
pnpm build              # Build packages/* then apps/api and apps/web
pnpm typecheck          # Strict TypeScript check across all workspaces
pnpm lint               # ESLint across all workspaces
pnpm format:check       # Prettier formatting verification
pnpm test               # Run all Vitest unit & integration tests
pnpm test:e2e           # Run Playwright E2E tests in apps/web
```

For full troubleshooting and environment details, see [`docs/07-devops/local-development-guide.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/07-devops/local-development-guide.md).

---

## 3B. Switching Branches by Team Role

All teammates work off `main` (or the active `phase/*` integration branch) using role-scoped feature/fix/docs branches defined in [`docs/07-devops/branching-and-code-review.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/07-devops/branching-and-code-review.md). **Never commit directly to `main`.**

First, sync your local `main`:

```bash
git checkout main
git pull origin main
```

Then switch to (or create) a branch for your role and task:

| Team Member     | Role & Focus                      | Example Branch Commands                         |
| :-------------- | :-------------------------------- | :---------------------------------------------- |
| **Vishwanath**  | Product & Frontend / UI Lead      | `git checkout -b feat/UI-design-tokens-shell`   |
| **Vivek**       | Tech Lead & Backend / Auth Lead   | `git checkout -b feat/API-core-foundation`      |
| **Yashwardhan** | Database & Infra / DevOps Lead    | `git checkout -b phase/phase-5-database-schema` |
| **Vishwas**     | QA, Security & Accessibility Lead | `git checkout -b feat/QA-test-harness`          |

Before opening a Pull Request back to `main` (or the active `phase/*` branch), verify all CI checks locally:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## 4. Engineering Team & Ownership Structure

| Team Member     | Primary Engineering & Delivery Ownership                                                                                           |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Vishwanath**  | **Product & Frontend Lead**: UX/UI design system, accessibility (WCAG 2.2 AA), client state architecture, responsive views.        |
| **Vivek**       | **Backend Engineer & Technical Lead**: Modular monolith architecture, REST APIs, session management, RBAC, tenant isolation.       |
| **Yashwardhan** | **Database & Infrastructure**: Relational schema, indexing strategy, data lifecycle, backup/recovery, containerization, DevSecOps. |
| **Vishwas**     | **QA, Analytics & Integration**: Quality assurance framework, tenant isolation test harness, performance profiling, audit logging. |

_Note: Individual ownership indicates primary accountability and does not replace peer review or shared responsibility for security, accessibility, and platform reliability._

---

## 5. Architectural Principles

1. **Modular Monolith First**: Clean domain boundaries within a single deployable artifact; avoids premature microservices complexity.
2. **Tenant Isolation by Design**: Every tenant-owned database query and API operation strictly enforces `school_id` authorization.
3. **Human-in-the-Loop Interventions**: Predictive or threshold-based student support flags are strictly advisory and require human pedagogical review.
4. **Zero-Trust Input Validation**: Server-side validation via Zod schemas for all inbound payloads, parameters, and headers.
5. **Accessibility as a First-Class Citizen**: WCAG 2.2 AA compliance, keyboard navigability, high contrast, low-bandwidth, and shared-device privacy.
6. **Defense in Depth**: Secure cookies, CSRF protection, rate limiting, audit trails, and strict Content Security Policies.

---

## 6. Documentation Index

The complete architectural, product, technical, and operational documentation is organized under the [`docs/`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/README.md) directory:

- [**00 - Project Governance**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/00-project-governance/project-charter.md): Charters, scope boundaries, success metrics, team roles, requirements source register, and phase roadmap.
- [**01 - Product Specifications**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/01-product/product-overview.md): Personas, functional/non-functional requirements, business rules, workflows, accessibility, and privacy.
- [**02 - Architecture & System Design**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/02-architecture/architecture-overview.md): C4 system context, container, module diagrams, ADRs, security threat modeling, and deployment topology.
- [**03 - Data Architecture**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/03-data/data-architecture.md): Conceptual model, entity inventory, ER diagrams, tenant ownership matrix, and backup/retention rules.
- [**04 - API Specifications**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/04-api/api-design-standards.md): REST standards, resource inventory, versioning, pagination, error schemas, and OpenAPI contracts.
- [**05 - UX & Frontend Planning**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/information-architecture.md): Information architecture, sitemap, role navigation, screen inventory, and design system requirements.
- [**06 - Quality & Security**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/06-quality-and-security/testing-strategy.md): Test harness strategy, tenant isolation test plans, security checklists, and release criteria.
- [**07 - DevOps & Operations**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/07-devops/repository-conventions.md): Branching strategy, CI/CD design, containerization, environment tiers, and incident runbooks.
- [**08 - Delivery & Traceability**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/implementation-phase-plan.md): 16-phase implementation roadmap, requirements traceability matrix, risk register, and acceptance matrices.
- [**Templates**](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/templates/ADR-template.md): Standardized templates for ADRs, feature specifications, API contracts, and phase completion reports.

---

## 7. Phase-Based Delivery Workflow

Development follows a strict gated phase model. Progress to subsequent phases requires formal stakeholder sign-off on exit criteria. Under no circumstances may application code or database schema migrations be introduced before explicit authorization of Phase 4 and Phase 5 respectively.

Refer to [AGENTS.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/AGENTS.md) for persistent agent rules and [CONTRIBUTING.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/CONTRIBUTING.md) for engineering collaboration guidelines.
