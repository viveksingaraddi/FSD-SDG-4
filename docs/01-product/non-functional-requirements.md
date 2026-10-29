# Non-Functional Requirements (NFRs)

This document establishes the authoritative non-functional requirements (NFRs) governing performance, accessibility, security, reliability, and device constraints for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Performance and Low-Bandwidth Optimization (PERF)

| Identifier | Requirement Statement | Target Benchmark | Verification Method |
| :--- | :--- | :--- | :--- |
| **NFR-PERF-001** | **API P95 Latency** | Read and write operations on standard transactional endpoints must complete within $\le 200\text{ ms}$ at P95 under standard load. | Supertest / k6 performance suites in CI. |
| **NFR-PERF-002** | **Complex Aggregation Latency**| Progress calculations and longitudinal class gradebook queries must complete within $\le 600\text{ ms}$ at P95. | Database query profiling & execution plan analysis. |
| **NFR-PERF-003** | **Client Bundle Size** | Initial production client bundle (JS + CSS) must not exceed $250\text{ KB}$ gzipped/Brotli compressed. | Automated bundle size analyzer during Vite production build. |
| **NFR-PERF-004** | **3G Mobile Load Time** | Initial meaningful paint (FCP) must occur within $\le 2.0\text{ s}$ on simulated Fast 3G / mid-tier mobile hardware. | Lighthouse mobile throttling profiling. |
| **NFR-PERF-005** | **Bulk Attendance Processing** | Bulk attendance submission for a 35-student roster must persist within $\le 250\text{ ms}$ server processing time. | Load testing endpoint with simulated concurrent classes. |

---

## 2. Accessibility, Usability & Inclusivity (A11Y)

| Identifier | Requirement Statement | Target Benchmark | Verification Method |
| :--- | :--- | :--- | :--- |
| **NFR-A11Y-001** | **WCAG 2.2 Level AA Conformance**| All user interfaces must fully satisfy W3C WCAG 2.2 Level AA guidelines. | Automated `axe-core` CI scans reporting zero Level A/AA violations. |
| **NFR-A11Y-002** | **Complete Keyboard Navigation** | All interactive components (menus, dialogs, form controls, tables) must be fully operable via keyboard without trap. | Manual and automated Playwright keyboard tab-order tests. |
| **NFR-A11Y-003** | **Color Contrast Ratios** | Text and interactive elements must meet minimum contrast ratios of $4.5:1$ for normal text and $3.0:1$ for large text/icons. | Headless color-contrast auditing in design system. |
| **NFR-A11Y-004** | **Screen-Reader Compatibility** | Form inputs must have explicit accessible labels; state changes (loading, alerts) must announce via ARIA live regions. | NVDA / VoiceOver manual verification scripts. |
| **NFR-A11Y-005** | **Cognitive Simplicity** | Instructional copy, error messages, and support flag rationale must use clear, non-jargon language ($\le$ Grade 8 readability). | Content linting and UX review. |

---

## 3. Security, Privacy & Tenant Isolation (SEC)

| Identifier | Requirement Statement | Target Benchmark | Verification Method |
| :--- | :--- | :--- | :--- |
| **NFR-SEC-001** | **Strict Multi-Tenant Isolation** | No API request from Tenant A may return, mutate, or acknowledge the existence of Tenant B records. | Automated cross-tenant isolation test suite executing in CI. |
| **NFR-SEC-002** | **Cryptographic Password Storage**| All passwords hashed using Argon2id with minimum memory cost 64 MB, time cost 3 iterations, parallelism 4. | Unit test verifying hashing parameters and salt generation. |
| **NFR-SEC-003** | **Secure Cookie Transport** | Session cookies must enforce `HttpOnly`, `Secure` (in production), and `SameSite=Lax` attributes. | Supertest assertions on `Set-Cookie` headers. |
| **NFR-SEC-004** | **Content Security Policy (CSP)**| Server must transmit strict security headers: CSP (no unsafe-inline), HSTS, X-Content-Type-Options: nosniff, Frame-Options: DENY. | Automated header inspection tests. |
| **NFR-SEC-005** | **Zero Real PII in Non-Prod** | Development, test, and staging environments must never store real student names, addresses, or identifiers. | Synthetic fixture generator auditing and automated linting. |

---

## 4. Reliability, Availability & Recovery (REL)

| Identifier | Requirement Statement | Target Benchmark | Verification Method |
| :--- | :--- | :--- | :--- |
| **NFR-REL-001** | **Service Availability** | Platform uptime must achieve $\ge 99.5\%$ outside scheduled maintenance windows. | Synthetic uptime monitoring probes. |
| **NFR-REL-002** | **Recovery Point Objective (RPO)**| Maximum tolerable data loss in disaster recovery is $\le 1\text{ hour}$. | Automated daily database snapshots + WAL archiving. |
| **NFR-REL-003** | **Recovery Time Objective (RTO)**| Platform recovery time from total cloud outage must be $\le 2\text{ hours}$. | Semi-annual simulated disaster restoration dry run. |
| **NFR-REL-004** | **Graceful Offline Degrade** | If internet connectivity drops mid-session, the UI must alert the user immediately without crashing or wiping form inputs. | Playwright offline network simulation tests. |

---

## 5. Shared-Device & Educational Operational Constraints (DEV)

| Identifier | Requirement Statement | Target Benchmark | Verification Method |
| :--- | :--- | :--- | :--- |
| **NFR-DEV-001** | **Shared-Device Privacy** | Explicit logout must completely destroy the server session, purge client cache, and clear local state stores. | Playwright test checking local memory and cookie clearing. |
| **NFR-DEV-002** | **Session Idle Timeout** | Unattended sessions must trigger an idle warning after 60 minutes and terminate after 8 hours to protect shared terminals. | Integration test simulating session expiry. |
