# Developer Onboarding Guide — FSD-SDG-4

**Date**: 2026-11-12  
**Repository**: `https://github.com/viveksingaraddi/FSD-SDG-4.git`

---

## 1. Prerequisites

- **Node.js**: `>= 20.0.0` (see `.nvmrc` at repository root; tested on Node `v24.11.1`)
- **pnpm**: `10.x` (configured via `packageManager: "pnpm@10.34.6"`; enable via `corepack enable`)
- **PostgreSQL**: `16.x` running locally (tested on PostgreSQL `16.15`)
- **Git**: `2.40+`

---

## 2. Repository Setup & Dependency Installation

```bash
git clone https://github.com/viveksingaraddi/FSD-SDG-4.git
cd FSD-SDG-4
pnpm install
pnpm --filter './packages/*' build
```

> [!NOTE]
> Always build shared workspace packages (`@fsd-sdg4/shared-types`, `@fsd-sdg4/validation`, `@fsd-sdg4/contracts`) before running `apps/api` or `apps/web` after pulling changes to `packages/*`.

---

## 3. Environment Variable Setup

Create `apps/api/.env` locally (gitignored — **never** commit `.env` files or real secrets). Note: `.env.example` is not yet committed in the repository; use the validated schema from [`apps/api/src/config/env.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/config/env.ts):

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
DATABASE_URL="postgresql://<your-pg-user>@localhost:5432/fsd_sdg4_dev"
CORS_ORIGIN="http://localhost:5173"
API_VERSION="0.1.0"
```

For integration tests, create a separate test database (`fsd_sdg4_test`) and pass its `DATABASE_URL` when running `test:integration`.

---

## 4. Database Setup, Migrations & Seeding

1. Create local PostgreSQL databases:
   ```bash
   createdb fsd_sdg4_dev
   createdb fsd_sdg4_test
   ```
2. Generate Prisma Client, apply migrations, and load synthetic seed data:
   ```bash
   pnpm --filter @fsd-sdg4/api db:generate
   DATABASE_URL="postgresql://<your-pg-user>@localhost:5432/fsd_sdg4_dev" pnpm --filter @fsd-sdg4/api db:migrate
   DATABASE_URL="postgresql://<your-pg-user>@localhost:5432/fsd_sdg4_dev" pnpm --filter @fsd-sdg4/api db:seed
   ```
3. Apply migrations to the isolated test database:
   ```bash
   DATABASE_URL="postgresql://<your-pg-user>@localhost:5432/fsd_sdg4_test" pnpm --filter @fsd-sdg4/api db:migrate
   ```

---

## 5. Starting Backend & Frontend

In separate terminals from the repository root:

- **Backend API (`http://localhost:3001`)**:

  ```bash
  pnpm --filter @fsd-sdg4/api dev
  ```

  Verify health: `curl http://localhost:3001/health` and `curl http://localhost:3001/api/v1/ready`.

- **Frontend Web (`http://localhost:5173`)**:
  ```bash
  pnpm --filter @fsd-sdg4/web dev
  ```

---

## 6. Verification & Test Commands

```bash
pnpm format:check     # Verify Prettier formatting
pnpm lint             # Run ESLint across workspace
pnpm typecheck        # Run TypeScript strict checks
pnpm test             # Run all unit tests (packages + api + web)
pnpm build            # Build all packages and apps

# Database integration tests (requires fsd_sdg4_test):
DATABASE_URL="postgresql://<your-pg-user>@localhost:5432/fsd_sdg4_test" pnpm --filter @fsd-sdg4/api test:integration
```

---

## 7. Git Workflow Summary

1. Switch to your assigned branch (`feature/admin-portal`, `feature/teacher-portal`, `feature/student-portal`, or `feature/parent-portal`).
2. Rebase onto `origin/develop` before starting work and before opening a PR.
3. Follow [`team-development-contract.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/team-development-contract.md) and [`git-branching-strategy.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/08-delivery/git-branching-strategy.md).
