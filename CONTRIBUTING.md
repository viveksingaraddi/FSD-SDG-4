# Contributing to FSD-SDG-4 Quality Education SaaS

Thank you for contributing to the FSD-SDG-4 Quality Education SaaS project. This repository follows rigorous engineering, security, and quality governance to build a resilient, accessible, multi-tenant educational platform.

> **IMPORTANT REMINDER**: The project is currently in **Phase 0**. No application code may be introduced. Contributions in Phase 0 are strictly limited to architectural specifications, ADRs, documentation, and design models.

---

## 1. Code of Conduct and Collaboration Principles

1. **Inclusive & Respectful**: We foster an inclusive environment centered on empathy and constructive feedback.
2. **Quality & Responsibility**: Engineering ownership means cross-reviewing peers' work for security, accessibility, and performance.
3. **No Unilateral Architecture Shifts**: Significant changes to architectural patterns, libraries, or data models must be proposed via an Architecture Decision Record (ADR) under `docs/02-architecture/decisions/`.

---

## 2. Git Workflow and Branching Strategy

We follow a structured Git feature-branch workflow rooted in `main`:

- `main`: Protected production-ready branch. Direct pushes are disabled.
- `phase/phase-<number>-<title>`: Phase integration branches (e.g., `phase/phase-1-requirements`).
- `feat/<issue-id>-<description>`: Feature additions (e.g., `feat/AUTH-101-session-cookie-validation`).
- `fix/<issue-id>-<description>`: Bug fixes (e.g., `fix/ATT-202-timezone-offset`).
- `docs/<issue-id>-<description>`: Documentation changes (e.g., `docs/ARCH-005-api-pagination`).

### Commit Message Standards
Commits must adhere to the **Conventional Commits** specification:

```text
<type>(<scope>): <short description in present tense>

[optional body explaining motivation and context]

[optional footer with issue reference, e.g., Refs: #42]
```

**Allowed Types**:
- `feat`: A new feature (only in authorized implementation phases)
- `fix`: A bug fix
- `docs`: Documentation only changes
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Maintenance tasks, dependencies, tooling adjustments

---

## 3. Pull Request Requirements

Every pull request must:
1. Reference a tracking issue or phase milestone.
2. Include a clear description of the problem solved and the approach taken.
3. Include updated documentation matching all architectural and schema changes.
4. Pass all automated CI checks (once implemented in Phase 4+):
   - Type checking (`tsc --noEmit`)
   - Code formatting (`prettier --check`)
   - Linting (`eslint`)
   - Test suites (`vitest`)
   - Accessibility audits (`axe-core`)
5. Receive at least one peer approval from a domain lead:
   - Frontend/UX: Vishwanath
   - Backend/Architecture: Vivek
   - Database/Infra: Yashwardhan
   - QA/Security: Vishwas

---

## 4. Phase Governance & Definition of Done

Work is organized in gated phases (0 through 16). A phase is considered **Done** only when:
- All functional and non-functional requirements assigned to the phase meet their acceptance criteria.
- All unit, integration, and security tests pass with required coverage.
- All relevant documentation is updated.
- A Phase Completion Report is submitted and approved by stakeholders.
