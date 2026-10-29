# Architecture Quality Attributes (ISO 25010)

This document maps the architectural design of the **FSD-SDG-4 Quality Education SaaS** platform against the international ISO/IEC 25010 software product quality framework.

---

## 1. Quality Attribute Matrix

| ISO 25010 Characteristic | Architectural Strategy & Countermeasure | Metric / Target Threshold |
| :--- | :--- | :--- |
| **Functional Suitability** | Domain-driven modular monolith modeling the complete loop: $\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$. | 100% test scenario pass rate for all P0 acceptance criteria. |
| **Performance Efficiency** | Vite bundle optimization ($< 250\text{ KB}$), composite B-tree PostgreSQL indexes, parameterized bulk roster inserts. | P95 API read/write latency $\le 200\text{ ms}$; bulk attendance $\le 250\text{ ms}$. |
| **Compatibility** | Standard HTTPS REST `/api/v1` with JSON/OpenAPI; responsive viewport rendering across mobile, tablet, and desktop. | Cross-browser compatibility across Chrome, Safari, Firefox, Edge; mobile viewports down to 320px. |
| **Usability & Accessibility**| WCAG 2.2 Level AA conformance; headless accessible primitives; high contrast ($4.5:1$); clear non-jargon language. | $0$ automated `axe-core` accessibility errors; morning attendance completed in $\le 90\text{ s}$. |
| **Reliability** | ACID transactional boundaries; healthcheck probes; graceful connection pool draining; continuous database WAL archiving. | Availability $\ge 99.5\%$; $\text{RPO} \le 1\text{ hour}$; $\text{RTO} \le 2\text{ hours}$. |
| **Security** | Zero-trust multi-tenancy; Argon2id password hashing; server-managed sessions with `HttpOnly` cookies; STRIDE mitigations. | $0.00\%$ cross-tenant data leakage incidents; zero high/critical vulnerabilities. |
| **Maintainability** | Strict TypeScript throughout; modular monolith boundaries with explicit public interfaces; comprehensive ADR log. | Zero TypeScript compilation errors in strict mode; test coverage $\ge 85\%$ on domain services. |
| **Portability** | OCI-compliant container architecture (Docker); standard Node.js LTS and PostgreSQL 16+ without cloud-vendor lock-in. | Platform runnable on any major cloud container service (AWS, GCP, Azure, Fly.io, Render). |
