# Monorepo Repository Structure — FSD-SDG-4 Quality Education SaaS

**Phase**: `PHASE 4: Repository Scaffolding & Development Environment`\
**Status**: Authoritative Architectural Repository Map\
**Last Updated**: 2026-11-05

---

## 1. Directory Tree Overview

```text
FSD-SDG-4/
├── apps/
│   ├── api/                           # Node.js + Express backend service
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── env.ts             # Boot-time environment validation via Zod
│   │   │   ├── lib/
│   │   │   │   └── logger.ts          # Structured Pino logging singleton
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts    # RFC 7807 Problem Details error handler
│   │   │   │   └── requestId.ts       # UUID request tracing middleware
│   │   │   ├── routes/
│   │   │   │   ├── health.ts          # /health (liveness) & /api/v1/ready (readiness)
│   │   │   │   └── v1/
│   │   │   │       └── index.ts       # /api/v1 route aggregator
│   │   │   ├── app.ts                 # Express application factory (unbound)
│   │   │   ├── app.test.ts            # Integration & health endpoint tests
│   │   │   └── server.ts              # Server bootstrap and graceful shutdown
│   │   ├── .env.example               # Safe environment template
│   │   ├── .env.test.example          # Test environment template
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── web/                           # React 18+ SPA with Vite and Tailwind CSS
│       ├── e2e/
│       │   └── app.spec.ts            # Playwright end-to-end smoke test
│       ├── src/
│       │   ├── components/
│       │   │   ├── feedback/
│       │   │   │   └── ErrorBoundary.tsx # React error boundary component
│       │   │   └── layout/
│       │   │       └── AppShellPlaceholder.tsx # Phase 4 placeholder shell
│       │   ├── pages/
│       │   │   └── NotFoundPage.tsx   # Accessible 404 error page
│       │   ├── styles/
│       │   │   └── globals.css        # Global CSS with Phase 3 design tokens
│       │   ├── App.tsx                # App shell, routing, skip link
│       │   ├── App.test.tsx           # Unit tests with React Testing Library
│       │   ├── main.tsx               # Root DOM mount and query client provider
│       │   ├── test-setup.ts          # Vitest DOM matchers setup
│       │   └── vite-env.d.ts          # Vite client types
│       ├── .env.example
│       ├── index.html
│       ├── package.json
│       ├── playwright.config.ts
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── vitest.config.ts
│
├── packages/
│   ├── config/                        # Shared tooling configurations
│   │   ├── package.json
│   │   └── vitest.base.ts
│   │
│   ├── contracts/                     # API contracts and route path constants
│   │   ├── src/
│   │   │   ├── index.ts               # Canonical API_ROUTES and envelope types
│   │   │   └── index.test.ts          # Contract integrity test suite
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── shared-types/                  # Shared TypeScript types (isomorphic, types-only)
│   │   ├── src/
│   │   │   ├── index.ts               # Core entity types, enums, status unions
│   │   │   └── index.test.ts          # Type union completeness tests
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── validation/                    # Shared isomorphic Zod validation schemas
│       ├── src/
│       │   ├── index.ts               # Common validation schemas (email, pagination, dates)
│       │   └── index.test.ts          # Schema validation unit tests
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # Continuous integration workflow
│
├── docs/                              # Project documentation hierarchy (Phases 0–3)
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.mjs                  # ESLint flat config with strict TypeScript
├── package.json                       # Monorepo root package definition
├── pnpm-workspace.yaml                # pnpm workspace definition
└── tsconfig.base.json                 # Shared base TypeScript strict config
```
