# Stakeholders and Team Organization

This document formalizes the engineering organizational structure, individual ownership domains, and collaborative governance model for the FSD-SDG-4 Quality Education SaaS project.

---

## 1. Engineering Leadership & Domain Ownership

The development team comprises four core engineering leads:

| Engineer | Primary Roles & Title | Core Responsibilities & Deliverables |
| :--- | :--- | :--- |
| **Vishwanath** | **Product & Frontend Lead** | - Product vision, requirements curation, and user story definitions.<br>- Frontend application architecture (React, TypeScript, Vite, Tailwind).<br>- Reusable accessible UI design system (WCAG 2.2 AA).<br>- Client state management (TanStack Query) and responsive viewports. |
| **Vivek** | **Backend Engineer & Technical Lead** | - Overall technical architecture and modular monolith design.<br>- REST API design, OpenAPI specifications, and versioning (`/api/v1`).<br>- Identity, authentication, server-managed sessions, and RBAC.<br>- Multi-tenant isolation enforcement in data-access services. |
| **Yashwardhan** | **Database & Infrastructure Lead** | - PostgreSQL relational schema design and Prisma ORM data modeling.<br>- Relational constraints, indexing strategy, and database performance.<br>- Backup and disaster recovery strategies, migration discipline.<br>- Containerization (Docker), environment tier strategy, and DevSecOps. |
| **Vishwas** | **QA, Analytics & Integration Lead** | - Quality assurance framework (Vitest, Supertest, Playwright).<br>- Automated multi-tenant isolation testing harness.<br>- Performance and load test profiling.<br>- Audit logging verification and compliance reporting. |

*Governance Mandate*: Individual ownership establishes clear accountability for specific architectural domains, but does NOT prevent cross-review. Security, accessibility, and platform reliability are shared team responsibilities. All pull requests require cross-domain review.

---

## 2. RACI Governance Matrix

- **R**esponsible: The person who conducts the actual design or implementation.
- **A**ccountable: The single person with final approval authority for that domain.
- **C**onsulted: Team members who provide input, review, or domain expertise.
- **I**nformed: Team members kept updated on progress and decisions.

| Functional / Architectural Domain | Vishwanath (Product/UI) | Vivek (Tech/Backend) | Yashwardhan (DB/Infra) | Vishwas (QA/Analytics) |
| :--- | :---: | :---: | :---: | :---: |
| **Product Scope & Requirements** | **A / R** | C | C | C |
| **Frontend Architecture & UI System** | **A / R** | C | I | C |
| **API Architecture & Contracts** | C | **A / R** | C | C |
| **Authentication & RBAC Logic** | C | **A / R** | C | C |
| **Tenant Isolation Enforcement** | I | **A / R** | C | C |
| **Database Schema & Migrations** | C | C | **A / R** | C |
| **Infrastructure & CI/CD Pipelines** | I | C | **A / R** | C |
| **Test Strategy & Quality Harness** | C | C | C | **A / R** |
| **Security & Threat Model Review** | C | **A** | C | R |
| **WCAG 2.2 AA Accessibility Auditing**| R | I | I | **A** |
| **Disaster Recovery & Backup Plan** | I | C | **A / R** | C |

---

## 3. External Stakeholders & Persona Proxies

To ensure the platform aligns with real-world school requirements, the team designates internal lead proxies for key user personas during Phase 0 through Phase 3:

- **Platform Super Admin Proxy**: Vivek (Technical Lead)
- **School Administrator Proxy**: Vishwanath (Product Lead)
- **Teacher Persona Proxy**: Vishwanath & Vishwas (Pedagogical workflows & grading)
- **Student Persona Proxy**: Vishwanath (Accessibility & mobile usability)
- **Parent / Guardian Persona Proxy**: Vishwas (Information clarity & notifications)
