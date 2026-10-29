# Team Ownership and Responsibility Matrix

This document establishes the primary engineering accountability and peer review matrix across modules, architecture layers, and delivery phases for the four engineering leads: **Vishwanath**, **Vivek**, **Yashwardhan**, and **Vishwas**.

---

## 1. Domain & Module Ownership Matrix

| System Module / Architectural Area | Primary Engineering Owner | Secondary Peer Reviewer | Target Quality Standard |
| :--- | :--- | :--- | :--- |
| **Product Vision & Scope** | **Vishwanath** (Product Lead) | Vivek (Tech Lead) | Clear functional specs, zero scope creep. |
| **Frontend UI Design System** | **Vishwanath** (Frontend Lead) | Vishwas (QA Lead) | WCAG 2.2 AA certified, responsive $<640$px. |
| **Client State (TanStack Query)** | **Vishwanath** (Frontend Lead) | Vivek (Tech Lead) | Optimistic updates, cache invalidation. |
| **Modular Monolith Core** | **Vivek** (Tech Lead) | Yashwardhan (Infra Lead)| Clean domain boundaries, strict TypeScript. |
| **REST APIs & OpenAPI Specs** | **Vivek** (Tech Lead) | Vishwanath (Frontend Lead)| RFC 7807 error envelopes, Zod validation. |
| **Identity, Sessions & Auth** | **Vivek** (Tech Lead) | Vishwas (Security Lead) | Argon2id hashing, secure HttpOnly cookies. |
| **Multi-Tenant Isolation** | **Vivek** (Tech Lead) | Vishwas (Security Lead) | 100% automated isolation test coverage. |
| **Relational Data Architecture** | **Yashwardhan** (Database Lead) | Vivek (Tech Lead) | 3NF normalization, composite tenant keys. |
| **PostgreSQL Indexing & RLS** | **Yashwardhan** (Database Lead) | Vivek (Tech Lead) | B-Tree leading tenant index, query plans. |
| **Backup, Disaster Recovery & DDL**| **Yashwardhan** (Database Lead) | Vishwas (QA Lead) | RPO $\le 1$ hr, RTO $\le 2$ hrs dry-run verified. |
| **DevOps, Docker & CI/CD** | **Yashwardhan** (Infra Lead) | Vivek (Tech Lead) | Multi-stage OCI containers, automated gates. |
| **Automated Test Harness** | **Vishwas** (QA Lead) | Vivek (Tech Lead) | Vitest, Supertest, Playwright pipelines. |
| **Accessibility Auditing (A11y)** | **Vishwas** (QA Lead) | Vishwanath (Frontend Lead)| Zero `axe-core` Level A/AA violations. |
| **Performance & Load Testing** | **Vishwas** (QA Lead) | Yashwardhan (Infra Lead)| k6 load tests, P95 latency $\le 200$ms. |

---

## 2. Phase Leadership Accountabilities

- **Phases 0, 1, 2, 3, 13, 14**: Led by **Vishwanath** (Product, Information Architecture, Design System, Frontend Integration, Parent Portal).
- **Phases 6, 7, 8, 9, 10, 11, 12**: Led by **Vivek** (Backend Modular Monolith, Auth, Academic CRUD, Attendance, Coursework, Support Closed Loop).
- **Phases 4, 5, 16**: Led by **Yashwardhan** (Repository Scaffolding, Database Schema/Migrations, Cloud Hosting & Pilot Deployment).
- **Phase 15**: Led by **Vishwas** (Security Hardening, Accessibility Auditing, Load Testing & Acceptance Verification).
