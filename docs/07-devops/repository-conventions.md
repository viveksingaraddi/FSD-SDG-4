# Repository Conventions and Engineering Standards

This document establishes the repository structure, file naming standards, code style, and commit message conventions for the **FSD-SDG-4 Quality Education SaaS** project.

---

## 1. Directory and File Naming Conventions

- **Directories**: Lowercase kebab-case: `src/features/support-intervention/`, `src/modules/attendance/`.
- **Source Files (General)**: Lowercase kebab-case with descriptive suffix:  
  `attendance.service.ts`, `attendance.controller.ts`, `attendance.routes.ts`, `attendance.schemas.ts`.
- **React Components**: PascalCase for React component files: `Button.tsx`, `SupportPlanCard.tsx`, `RosterGrid.tsx`.
- **Test Files**: Adjacent to the code under test with `.test.ts` or `.test.tsx` extension:  
  `attendance.service.test.ts`, `Button.test.tsx`.
- **TypeScript Types**: Defined in `*.types.ts` or exported directly from the declaring schema module.

---

## 2. Strict TypeScript & Code Quality Policy

When implementation begins in authorized phases:
1. **Strict Mode Mandatory**: `"strict": true` enforced in `tsconfig.json`.
2. **Prohibited TypeScript Patterns**:
   - `any` is strictly prohibited. Use explicit types, generics, or `unknown` with runtime type narrowing.
   - Non-null assertions (`!`) are forbidden unless accompanied by an explanatory code comment.
   - Disabling TypeScript errors via `@ts-ignore` is prohibited in production code.
3. **Automated Linting and Formatting**:
   - ESLint configured with strict TypeScript, React hooks, and accessibility rules (`eslint-plugin-jsx-a11y`).
   - Prettier configured for deterministic formatting (2 spaces, single quotes, trailing commas).

---

## 3. Commit Message Standards (Conventional Commits)

All Git commits must strictly adhere to the **Conventional Commits v1.0.0** specification:

```text
<type>(<scope>): <subject in imperative present tense>

[optional body explaining motivation and context]

[optional footer with issue reference, e.g., Refs: #104]
```

**Permitted Commit Types**:
- `feat`: A new user-facing feature (only in authorized implementation phases).
- `fix`: A bug fix.
- `docs`: Documentation-only updates.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding or correcting automated tests.
- `chore`: Tooling, dependency, or configuration updates.

**Examples**:
- `docs(arch): establish ADR-0003 multi-tenancy strategy`
- `feat(attendance): implement bulk section attendance submission endpoint`
- `fix(auth): correct cookie max-age calculation on mobile safari`
