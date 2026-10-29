# ADR-0006: Testing and Quality Assurance Strategy

- **Status**: Proposed
- **Date**: 2026-10-29
- **Deciders**: Vishwas (QA Lead), Vivek (Tech Lead), Vishwanath (Frontend Lead), Yashwardhan (Infra Lead)

---

## 1. Context and Problem Statement

Educational platforms process mission-critical academic data and sensitive minor personal information. Bugs in attendance tracking, grading calculations, or tenant boundaries can cause profound educational, reputational, and legal consequences. We need a comprehensive, automated testing strategy that enforces code correctness, multi-tenant isolation, accessibility, and performance without slowing team delivery.

---

## 2. Decision

We adopt a multi-tier testing strategy built on **Vitest, Supertest, React Testing Library, and Playwright**:

1. **Unit Testing (Vitest)**: Tests pure business logic, calculations (attendance rates, weighted grades), and state transitions in domain services with a minimum target of **$\ge 85\%$ line coverage**.
2. **API Integration Testing (Supertest + Vitest)**: Executes HTTP requests against Express route handlers with a real PostgreSQL test database, validating status codes, Zod validation, and RBAC enforcement.
3. **Dedicated Tenant Isolation Testing**: A mandatory automated test harness verifies cross-tenant boundaries for every endpoint, asserting that School A credentials receive `404 Not Found` or `403 Forbidden` when attempting to access School B resources.
4. **Accessible Component Testing (React Testing Library + axe-core)**: Asserts that UI primitives render valid ARIA attributes, semantic tags, and report zero accessibility violations.
5. **End-to-End Testing (Playwright)**: Automates critical user journeys (teacher takes attendance, student submits assignment, teacher creates support plan) across desktop and mobile viewports.

---

## 3. Alternatives Considered

### Alternative A: Jest for Testing
- *Rejection Rationale*: Jest requires complex Babel/ts-jest transpilation configs and is significantly slower than Vitest in modern Vite-based TypeScript repositories. Vitest provides native ESM and TypeScript support with instant execution.

### Alternative B: Cypress for End-to-End Testing
- *Rejection Rationale*: Playwright offers faster headless execution, built-in mobile device emulation, native multi-tab support, and superior trace recording compared to Cypress.

---

## 4. Benefits

- **Zero-Tolerance Isolation Verification**: Automated CI tests ensure that no code change can leak cross-tenant records into production.
- **Unified Test Syntax**: Vitest shares API parity with Jest while executing natively via Vite's transform pipeline.
- **Accessibility Automation**: Continuous `axe-core` checks prevent UI regressions against WCAG 2.2 Level AA.

---

## 5. Conditions for Revisit

This decision will be revisited if:
1. Playwright test execution times exceed 15 minutes in CI, necessitating distributed test sharding.
