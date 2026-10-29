# FSD-SDG-4: Quality Education SaaS

> **CRITICAL NOTICE: PHASE 0 STATUS**  
> This repository is currently in **Phase 0: Project Foundation, Architecture & Documentation**.  
> **No application source code, executable scripts, frameworks, or database schemas have been implemented yet.**  
> All documents in this repository serve as the architectural and engineering blueprint for subsequent approved implementation phases.

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

- **Current Phase**: `PHASE 0: Project Foundation and Architecture Documentation`
- **Phase Status**: Completed / Documentation Ready for Formal Review
- **Next Authorized Phase**: `PHASE 1: Requirements Validation and Product Acceptance Criteria` (Pending approval)
- **Active Code Base**: None (Documentation only; strictly per Phase 0 constraints)

For live tracking of phase progress, open decisions, and risk registers, see [PROJECT_STATUS.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/PROJECT_STATUS.md) and [docs/08-delivery/implementation-status.md](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/implementation-status.md).

---

## 3. Technology Architecture Baseline (Proposed)

| Tier | Proposed Technology | Justification & Architectural Role |
| :--- | :--- | :--- |
| **Frontend** | React 18+, TypeScript (strict), Vite, Tailwind CSS | High-performance SPA, mobile-first responsive design, strict type safety, fast build cycles. Accessible headless primitives. |
| **State & Data Fetching** | TanStack Query, React Hook Form, Zod | Server-state caching and synchronization, performant schema-validated client-side forms. |
| **Client Routing** | React Router v6+ | Role-guarded client routes with layout nesting for multi-tenant portal separation. |
| **Backend Runtime** | Node.js (LTS), Express, TypeScript (strict) | Modular monolith architecture, predictable async I/O, domain-driven module structure. |
| **API Contract** | Versioned REST (`/api/v1`), OpenAPI 3.1, Zod | Type-safe runtime input validation, strict request/response contracts, automated schema generation. |
| **Data Layer** | PostgreSQL 16+, Prisma ORM | Relational integrity, ACID transaction boundaries, explicit foreign keys, indexing, and strict schema migrations. |
| **Tenancy Model** | Shared Database, Shared Schema (`school_id` partitioning) | Operational efficiency for initial SaaS footprint, enforced at data-access layer with defense-in-depth RLS evaluation. |
| **Identity & Sessions** | Server-Managed Sessions, HttpOnly/Secure/SameSite Cookies | Resilient against XSS token theft, instant session revocation, Argon2id password hashing, RBAC. |
| **Observability** | Pino Structured Logging, Healthchecks | JSON logging with correlation IDs (`requestId`, `tenantId`), graceful degradation, container readiness. |
| **Testing Suite** | Vitest, Supertest, React Testing Library, Playwright | Comprehensive unit, integration, API contract, tenant isolation, and browser end-to-end testing. |

---

## 4. Engineering Team & Ownership Structure

| Team Member | Primary Engineering & Delivery Ownership |
| :--- | :--- |
| **Vishwanath** | **Product & Frontend Lead**: UX/UI design system, accessibility (WCAG 2.2 AA), client state architecture, responsive views. |
| **Vivek** | **Backend Engineer & Technical Lead**: Modular monolith architecture, REST APIs, session management, RBAC, tenant isolation. |
| **Yashwardhan** | **Database & Infrastructure**: Relational schema, indexing strategy, data lifecycle, backup/recovery, containerization, DevSecOps. |
| **Vishwas** | **QA, Analytics & Integration**: Quality assurance framework, tenant isolation test harness, performance profiling, audit logging. |

*Note: Individual ownership indicates primary accountability and does not replace peer review or shared responsibility for security, accessibility, and platform reliability.*

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
