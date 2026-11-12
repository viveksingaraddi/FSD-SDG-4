# Local Development Guide — FSD-SDG-4 Quality Education SaaS

**Phase**: `PHASE 4: Repository Scaffolding & Development Environment`  
**Status**: Authoritative Local Development Manual  
**Last Updated**: 2026-11-05

---

## 1. Prerequisites

Before setting up the repository, ensure the following tools are installed on your host machine:

- **Node.js**: `v20.0.0` or higher (`v24.11.1` LTS recommended)
- **pnpm**: `v9.0.0` or higher (`v10.34.6` standard)
- **Git**: Modern release
- **PostgreSQL**: `16+` (for Phase 5 onwards)

Verify versions:

```bash
node --version  # should be >= 20.0.0
pnpm --version  # should be >= 9.0.0
```

---

## 2. Initial Setup

Clone the repository and install all workspace dependencies:

```bash
git clone <repository-url>
cd FSD-SDG-4
pnpm install
```

Build all shared packages:

```bash
pnpm --filter './packages/*' build
```

---

## 3. Environment Configuration

Copy the example environment templates:

```bash
# Backend environment
cp apps/api/.env.example apps/api/.env

# Frontend environment
cp apps/web/.env.example apps/web/.env
```

> [!CAUTION]
> Never commit `.env` or `.env.local` files to Git. All secret keys, connection strings, and tokens must remain in uncommitted local files.

---

## 4. Common Development Commands

### 4.1 Running Applications

| Command                             | Action                                                   |
| :---------------------------------- | :------------------------------------------------------- |
| `pnpm dev`                          | Run both frontend and backend concurrently in watch mode |
| `pnpm --filter '@fsd-sdg4/api' dev` | Run Express API server with `tsx watch` (port 3001)      |
| `pnpm --filter '@fsd-sdg4/web' dev` | Run Vite development server (port 5173)                  |

- **Frontend URL**: `http://localhost:5173`
- **Backend API URL**: `http://localhost:3001`
- **Health Endpoint**: `http://localhost:3001/health`
- **Readiness Probe**: `http://localhost:3001/api/v1/ready`

### 4.2 Building

```bash
# Build all packages and applications in dependency order
pnpm build

# Build packages only
pnpm --filter './packages/*' build

# Build frontend only
pnpm --filter '@fsd-sdg4/web' build

# Build backend only
pnpm --filter '@fsd-sdg4/api' build
```

### 4.3 Testing

```bash
# Run all unit and integration tests across workspaces
pnpm test

# Run tests in watch mode for a specific package
pnpm --filter '@fsd-sdg4/validation' test

# Run backend API integration tests
pnpm --filter '@fsd-sdg4/api' test

# Run frontend unit tests
pnpm --filter '@fsd-sdg4/web' test

# Run Playwright end-to-end tests
pnpm test:e2e
```

### 4.4 Code Quality & Formatting

```bash
# Run TypeScript type check across all workspaces
pnpm typecheck

# Run ESLint across the repository
pnpm lint

# Auto-fix lint violations where possible
pnpm lint:fix

# Check formatting with Prettier
pnpm format:check

# Format all code with Prettier
pnpm format
```

---

## 5. Clean Workspace

To reset build outputs and node_modules:

```bash
pnpm clean
pnpm install
pnpm build
```
