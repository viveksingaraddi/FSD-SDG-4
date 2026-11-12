# Testing and Quality Assurance Strategy

This document defines the testing pyramid, coverage thresholds, testing tools, and execution harnesses for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. The Quality Assurance Pyramid

```text
                  /\
                 /  \      Playwright E2E Tests (10%)
                /────\     Critical User Journeys across Mobile & Desktop
               /      \
              /────────\    Supertest API & Tenant Isolation Tests (30%)
             /          \   HTTP Endpoints, RBAC, Validation & Cross-Tenant Guards
            /────────────\
           /              \  Vitest Domain Service Unit Tests (60%)
          /────────────────\ Calculations, State Rules, Normalization & Logic
```

---

## 2. Testing Frameworks & Tooling

| Testing Level        | Primary Tooling                  | Target Scope                                                         | Execution Environment      |   Coverage Target    |
| :------------------- | :------------------------------- | :------------------------------------------------------------------- | :------------------------- | :------------------: |
| **Unit Testing**     | Vitest                           | Domain services, calculation utilities, state machines, Zod schemas. | Local / CI In-Memory       |   $\ge 85\%$ Lines   |
| **API Integration**  | Supertest + Vitest               | Express routes, Zod validation, error middleware, RBAC enforcement.  | Real PostgreSQL Container  | $\ge 80\%$ Endpoints |
| **Tenant Isolation** | Dedicated Vitest Harness         | Asserting zero cross-tenant read/write leakage across all routes.    | Multi-tenant test database |  **$100\%$ Routes**  |
| **Component & A11y** | React Testing Library + axe-core | UI primitives, accessible labels, keyboard focus, error states.      | jsdom / Vitest             |   Zero A/AA flaws    |
| **End-to-End (E2E)** | Playwright                       | Full browser user flows (attendance, grading, support intervention). | Headless Chromium/Mobile   |  Critical Journeys   |

---

## 3. Dedicated Tenant Isolation Test Harness

Because multi-tenant confidentiality is critical, the testing strategy includes a mandatory **Tenant Isolation Test Suite**:

1. **Test Fixtures**: Provisions two distinct synthetic school tenants (`Tenant A` and `Tenant B`) with registered administrators, teachers, sections, and students.
2. **Matrix Test Execution**: For every registered API endpoint:
   - Request is executed using `Tenant A` credentials targeting a `Tenant B` resource ID.
   - Test asserts that the response status code is strictly `404 Not Found` or `403 Forbidden`.
   - Test verifies via direct database assertion that `Tenant B` data was neither modified nor deleted.
3. **CI Blocker**: Any pull request that introduces a cross-tenant data leak immediately fails the automated CI pipeline and is blocked from merge.

---

## 4. Continuous Integration Pipeline Execution

Tests execute automatically on every pull request targeting `main`:

1. `npm run lint` (ESLint + Prettier check).
2. `npm run typecheck` (`tsc --noEmit` in strict mode).
3. `npm run test:unit` (Vitest unit and service tests).
4. `npm run test:integration` (Supertest API integration and tenant isolation tests).
5. `npm run test:a11y` (axe-core accessibility tests).
6. `npm run test:e2e` (Playwright smoke flows).
