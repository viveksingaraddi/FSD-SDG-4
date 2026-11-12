# Git Branching Strategy & GitHub Workflow — FSD-SDG-4

**Date**: 2026-11-12  
**Remote**: `https://github.com/viveksingaraddi/FSD-SDG-4.git`  
**Verified Baseline Commit**: `f9606f6`

---

## 1. Current Branch Architecture

| Branch                   | Purpose                                            | Current State                             |
| :----------------------- | :------------------------------------------------- | :---------------------------------------- |
| `main`                   | Protected release/integration milestone branch     | Synced with `origin/main` at `f9606f6`    |
| `develop`                | Primary integration branch for all portal features | Synced with `origin/develop` at `f9606f6` |
| `feature/admin-portal`   | Developer 1 — Super Admin & School Admin portals   | Exists on `origin` at `f9606f6`           |
| `feature/teacher-portal` | Developer 2 — Teacher portal                       | Exists on `origin` at `f9606f6`           |
| `feature/student-portal` | Developer 3 — Student portal                       | Exists on `origin` at `f9606f6`           |
| `feature/parent-portal`  | Developer 4 — Parent / Guardian portal             | Exists on `origin` at `f9606f6`           |

---

## 2. Clone & Branch Switching Commands

### Initial Clone

```bash
git clone https://github.com/viveksingaraddi/FSD-SDG-4.git
cd FSD-SDG-4
git fetch --all --prune
```

### Switching to Your Assigned Portal Branch

```bash
# Example for Developer 1 (replace with your assigned branch):
git checkout feature/admin-portal
git pull origin feature/admin-portal
```

### Creating a Sub-Task Branch (Optional, from `develop`)

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<portal>-<short-task>
```

---

## 3. Pull Request Process

1. **Target Branch**: All portal PRs must target `develop` (never commit directly to `main` or `develop`).
2. **Pre-PR Checklist**:
   - Rebase onto latest `origin/develop` (see Section 4).
   - Run `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
   - Confirm zero `.env` files, secrets, or real PII are staged.
3. **Reviewers**:
   - Portal-only PRs: At least 1 peer developer + Tech Lead (`Vivek`).
   - Shared contract, schema, auth, or UI primitive PRs: Tech Lead + Frontend/DB Lead as applicable.
4. **Promotion to `main`**: Only Tech Lead merges `develop` -> `main` after full integration verification.

---

## 4. Conflict Resolution Workflow

Keep your feature branch synchronized with `develop` daily to minimize conflicts:

```bash
git fetch origin
git checkout feature/<your-portal>
git rebase origin/develop
```

If conflicts occur:

1. Resolve conflicts in the listed files (never blindly accept `ours`/`theirs` on `schema.prisma`, `packages/contracts`, or `App.tsx`).
2. Re-run `pnpm install && pnpm --filter './packages/*' build && pnpm typecheck && pnpm test`.
3. Stage resolved files and continue:
   ```bash
   git add <resolved-files>
   git rebase --continue
   git push --force-with-lease origin feature/<your-portal>
   ```

---

## 5. Recommended GitHub Branch Protection Rules

Configure the following rules in GitHub (`Settings -> Branches`) for both `main` and `develop`:

- **Require a pull request before merging** (minimum 1 approval; 2 approvals for `main`).
- **Require status checks to pass before merging** (CI lint, typecheck, unit tests, build).
- **Disallow force pushes** and **disallow branch deletions** on `main` and `develop`.
- **Require linear history** (squash or rebase merge) for clean auditability.
