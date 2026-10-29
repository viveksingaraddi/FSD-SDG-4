# Branching Strategy and Code Review Standards

This document specifies the Git branching model, pull request (PR) lifecycle, peer review criteria, and automated status checks for the **FSD-SDG-4 Quality Education SaaS** project.

---

## 1. Branching Model

We follow a structured Git feature-branch workflow centered on the protected `main` branch:

```text
main (Protected: Production-ready baseline)
  │
  ├── phase/phase-1-requirements (Phase integration branch)
  │     ├── feat/AUTH-101-session-cookie
  │     ├── feat/ATT-202-bulk-roster
  │     └── fix/ATT-203-timezone-offset
  │
  └── docs/ARCH-007-api-pagination
```

### Branch Naming Taxonomy
- `main`: Protected production branch. Direct commits and force pushes are blocked.
- `phase/phase-<number>-<title>`: Active phase milestone integration branch.
- `feat/<issue-id>-<short-description>`: New functional capabilities.
- `fix/<issue-id>-<short-description>`: Bug fixes and defect corrections.
- `docs/<issue-id>-<short-description>`: Documentation additions and updates.

---

## 2. Pull Request (PR) Requirements

Every pull request targeting `main` or an active `phase/*` branch must:
1. **Reference a Tracking Issue**: Must link to a valid requirement ID or phase deliverable.
2. **Include Clear Description**: Explain the *Problem*, the *Approach Taken*, and any *Architectural Trade-offs*.
3. **Include Accompanying Tests**: Features must include unit and integration tests; bug fixes must include a regression test reproducing the issue.
4. **Pass All CI Checks**: Automated GitHub Actions workflow must complete with 100% green status.
5. **Receive At Least One Approved Review**: Must be reviewed and approved by the designated domain lead:
   - Frontend/Accessibility: Vishwanath
   - Backend/Architecture: Vivek
   - Database/Infra: Yashwardhan
   - QA/Security: Vishwas

---

## 3. Code Review Verification Checklist

During code review, reviewers must verify:
- [ ] Does this PR introduce any code outside the currently authorized phase scope?
- [ ] Does every database query enforce `school_id` tenant isolation?
- [ ] Are any raw database error messages or stack traces leaked to clients?
- [ ] Are all UI components accessible via keyboard and conform to WCAG 2.2 AA?
- [ ] Are all new environment variables documented and validated via Zod?
- [ ] Is test data 100% synthetic with zero real student PII?
