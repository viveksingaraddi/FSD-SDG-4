# Pull Request Report: Admin Portal Analytics, Settings and Operational Controls

**Date**: 2026-11-16  
**PR Title**: `feat(admin): complete analytics and administrative controls`  
**Source Branch**: `feature/admin-portal`  
**Target Branch**: `develop`  
**Task**: FSD-SDG-4 Admin Portal — Task 11: Admin Portal Analytics, Settings and Operational Controls  
**Developer**: Project Lead (Super Admin + School Admin)  
**Status**: **READY FOR PULL REQUEST**

---

## 1. Executive Summary

This deliverable fulfills Task 11 of the Admin Portal implementation. It completes and refines operational analytics, platform settings, school settings, and administrative monitoring capabilities across both administrative tiers: Platform Super Admin and School Administrator.

### Key Capabilities Delivered

1. **Super Admin Platform Analytics & Scale Metrics**:
   - Date-range filtering across `all`, `30d`, `90d`, and `year` periods.
   - Real-time aggregation of total registered schools, active, suspended, and archived institutions.
   - User distribution across all 5 platform roles (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`).
   - Registration trends by month.
   - Institutional adoption metrics: average students per school, schools with active academic year adoption percentage, invitation acceptance rate.
   - Operational telemetry: platform-wide course offerings, active assignments, and cumulative examinations.

2. **Super Admin Platform Governance & Audit Stream**:
   - Cross-tenant security and audit stream with multi-tenant scope visibility (`schoolId` or `Platform Global`).
   - Category filtering across `ALL`, `AUTH`, `SCHOOL`, `ACADEMIC`, `USER`, and `SETTINGS`.
   - Action name search and `startDate` / `endDate` boundary filtering.
   - Security-sanitized payload inspector modal (`AuditPayloadModal`) redacting sensitive fields (passwords, tokens, secrets, salt) before display.

3. **Super Admin Platform Settings & Telemetry**:
   - Verified platform security policies showcase:
     - Session & Cookie Policy (`maxAgeSeconds`, `sameSite`, `secure`, `httpOnly`).
     - CSRF Protection (`X-CSRF-Token` header requirement).
     - Password & Cryptography Policy (`Argon2id`, 12-char minimum, complexity requirements).
     - Zero-Trust Multi-Tenant Isolation (`school_id` schema discriminator enforced in session context).
     - Rate Limiting (global and authentication tier request throttles).
     - Gmail SMTP Email Delivery (TLS 465 Nodemailer delivery).
     - Runtime telemetry: platform version, environment tier, and API surface.

4. **School Admin Analytics & Operational Widgets**:
   - Attendance trend toggle (`7D` vs `30D`) calculating live present/absent ratios and daily trend meters.
   - Academic performance overview: course offerings count, assignment status breakdown (`PUBLISHED`, `DRAFT`, `ARCHIVED`), and upcoming examinations roster.
   - Pending administrative tasks widget highlighting items requiring action (e.g. no active academic term, pending teacher support interventions, unallocated faculty).
   - User invitations and onboarding progress widget tracking invitation statuses (`ACCEPTED`, `PENDING`, `EXPIRED`, `REVOKED`).

5. **School Admin Settings & Institutional Audit**:
   - Dual-tab view: "School Profile & Preferences" and "Institutional Audit Log".
   - Official institutional profile metadata (read-only school code, subdomain, tenant status, and active academic year reference).
   - Operational notification preferences form (automated email notifications, weekly attendance digest, student support alert flags) with mutation persistence and audit trail emission (`SCHOOL_SETTINGS_UPDATED`).
   - Tenant-isolated audit log with category pills, action filter, and payload inspector.

---

## 2. Files Changed Inventory

| File                                                                                                                                                                                 | Change Description                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/contracts/src/index.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/packages/contracts/src/index.ts)                                                             | Added `PlatformAdoptionMetricsDto`, `PlatformOperationalStatsDto`, `PlatformSecurityPoliciesDto`, `PlatformSettingsDto`, `SchoolPendingTaskDto`, extended `PlatformOverviewDto`, `SchoolOverviewDto`, `SchoolAcademicSummaryDto`, `SchoolSettingsDto`, and `AuditLogDto`. |
| [`packages/validation/src/index.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/packages/validation/src/index.ts)                                                           | Added `overviewQuerySchema`, `schoolOverviewQuerySchema`, `auditLogsQuerySchema`, and extended `updateSchoolSettingsSchema` with preferences.                                                                                                                             |
| [`apps/api/src/modules/super-admin/superAdmin.service.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/super-admin/superAdmin.service.ts)               | Enhanced `getPlatformOverview` with period filtering and adoption metrics; added `getPlatformSettings`; enhanced `listPlatformAuditLogs` with category/date filtering and secret sanitization.                                                                            |
| [`apps/api/src/modules/super-admin/superAdmin.routes.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/super-admin/superAdmin.routes.ts)                 | Mounted `overviewQuerySchema` on `GET /api/v1/super-admin/overview`, added `GET /api/v1/super-admin/settings`, and mounted `auditLogsQuerySchema` on `GET /api/v1/super-admin/audit-logs`.                                                                                |
| [`apps/api/src/modules/super-admin/superAdmin.routes.test.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/super-admin/superAdmin.routes.test.ts)       | Added tests for period filtering, platform settings retrieval, and category-filtered audit logs.                                                                                                                                                                          |
| [`apps/api/src/modules/school-admin/schoolAdmin.service.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/school-admin/schoolAdmin.service.ts)           | Enhanced `getSchoolOverview` with attendance periods, course offerings, assignments status breakdown, and pending tasks; added category/date filtering to `listSchoolAuditLogs`; implemented preferences update and audit event in `updateSchoolSettings`.                |
| [`apps/api/src/modules/school-admin/schoolAdmin.routes.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/school-admin/schoolAdmin.routes.ts)             | Mounted `schoolOverviewQuerySchema` on `GET /api/v1/school/overview` and `auditLogsQuerySchema` on `GET /api/v1/school/audit-logs`.                                                                                                                                       |
| [`apps/api/src/modules/school-admin/schoolAdmin.routes.test.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/school-admin/schoolAdmin.routes.test.ts)   | Added tests for overview period filtering, audit log category filtering, settings retrieval, and preferences updating.                                                                                                                                                    |
| [`apps/web/src/features/super-admin/superAdminApi.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/super-admin/superAdminApi.ts)                       | Added period support to `fetchPlatformOverview`, added `fetchPlatformSettings`, and enhanced `fetchPlatformAuditLogs` with category and date options.                                                                                                                     |
| [`apps/web/src/features/super-admin/SuperAdminDashboardPage.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/super-admin/SuperAdminDashboardPage.tsx) | Integrated period query key to backend, added Institutional Adoption & Platform Operations telemetry cards.                                                                                                                                                               |
| [`apps/web/src/features/super-admin/PlatformGovernancePage.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/super-admin/PlatformGovernancePage.tsx)   | Implemented category tabs, date filters, action search, and sanitized audit payload inspector modal.                                                                                                                                                                      |
| [`apps/web/src/features/super-admin/PlatformSettingsPage.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/super-admin/PlatformSettingsPage.tsx)       | Implemented security policy cards for session/cookies, CSRF, Argon2id, tenant isolation, rate limiting, and runtime telemetry.                                                                                                                                            |
| [`apps/web/src/features/super-admin/SuperAdminPortal.test.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/super-admin/SuperAdminPortal.test.tsx)     | Added tests for `PlatformSettingsPage` and `PlatformGovernancePage`.                                                                                                                                                                                                      |
| [`apps/web/src/features/admin/schoolAdminApi.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/admin/schoolAdminApi.ts)                                 | Added period support to `fetchSchoolOverview` and enhanced `fetchSchoolAuditLogs` with category and date filters.                                                                                                                                                         |
| [`apps/web/src/features/admin/SchoolAdminDashboardPage.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/admin/SchoolAdminDashboardPage.tsx)           | Added 7D/30D attendance period toggle, course offerings counter, assignments status breakdown, pending tasks widget, and invitation progress widget.                                                                                                                      |
| [`apps/web/src/features/admin/SchoolSettingsPage.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/admin/SchoolSettingsPage.tsx)                       | Rebuilt with dual tabs (Profile & Preferences and Institutional Audit Log), active calendar link, operational preferences form, and filterable audit trail.                                                                                                               |
| [`apps/web/src/features/admin/SchoolAdminPortal.test.tsx`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/web/src/features/admin/SchoolAdminPortal.test.tsx)               | Added unit tests verifying `SchoolSettingsPage` tabs, preferences update mutation, and audit trail rendering.                                                                                                                                                             |

---

## 3. API Dependencies & Contracts

- `GET /api/v1/super-admin/overview?period=all|30d|90d|year` (Super Admin only)
- `GET /api/v1/super-admin/settings` (Super Admin only)
- `GET /api/v1/super-admin/audit-logs?category=ALL|AUTH|...&startDate=...&endDate=...` (Super Admin only)
- `GET /api/v1/school/overview?period=7d|30d` (School Admin only, strictly tenant-scoped)
- `GET /api/v1/school/settings` (School Admin only, strictly tenant-scoped)
- `PATCH /api/v1/school/settings` (School Admin only, strictly tenant-scoped)
- `GET /api/v1/school/audit-logs?category=...&startDate=...` (School Admin only, strictly tenant-scoped)

---

## 4. Security & Tenant Isolation Verification

1. **Zero-Trust Tenant Boundary**:
   - All School Admin routes invoke `resolveTenantSchoolId(req)` to resolve `schoolId` directly from the authenticated session context. No request parameter or body property can override the tenant identifier.
2. **Role Separation**:
   - Super Admin routes strictly require `req.auth.role === 'SUPER_ADMIN'`. Any non-Super Admin (including School Admin) calling `/api/v1/super-admin/*` receives HTTP 403 Forbidden.
   - School Admin routes strictly require `req.auth.role === 'SCHOOL_ADMIN'`.
3. **Payload Sanitization**:
   - In both Super Admin and School Admin audit services, delta objects undergo recursive sanitization redacting `password`, `token`, `secret`, `hash`, `salt`, `key`, and `apiKey` before delivery to the client.
4. **CSRF Enforcement**:
   - Mutating routes (`PATCH /api/v1/school/settings`) enforce `X-CSRF-Token` validation.

---

## 5. Verification & Test Outputs

### A. Prettier & Git Diff Check (`pnpm format:check && git diff --check`)

```text
Checking formatting...
All matched files use Prettier code style!
Exit code: 0 (PASS)
```

### B. TypeScript Workspace Typecheck (`pnpm typecheck`)

```text
Scope: 6 of 7 workspace projects
packages/contracts: tsc --noEmit (PASS)
packages/shared-types: tsc --noEmit (PASS)
packages/validation: tsc --noEmit (PASS)
apps/api: tsc --noEmit (PASS)
apps/web: tsc --noEmit (PASS)
Exit code: 0 (PASS)
```

### C. Backend API Test Suite (`pnpm --filter @fsd-sdg4/api test`)

```text
Test Files  13 passed (13)
Tests       122 passed (122)
Exit code: 0 (PASS)
```

### D. Frontend Web Test Suite (`pnpm --filter @fsd-sdg4/web test`)

```text
Test Files  11 passed (11)
Tests       43 passed (43)
Exit code: 0 (PASS)
```

### E. Workspace Production Build (`pnpm build`)

```text
Scope: 4 packages + 2 apps
apps/web: vite v8.3.6 building client environment for production... (built in 534ms)
apps/api: tsc --project tsconfig.json (PASS)
Exit code: 0 (PASS)
```

---

## 6. Acceptance Checklist

- [x] Super Admin Analytics: Total registered schools, active/suspended/archived counts: **PASS**
- [x] Super Admin Analytics: User distribution across 5 roles and registration trends: **PASS**
- [x] Super Admin Analytics: Adoption & scale metrics (average students, active year adoption, invitation acceptance rate, operational stats): **PASS**
- [x] Super Admin Analytics: Date-range filters (`all`, `30d`, `90d`, `year`) backed by real database calculations: **PASS**
- [x] School Admin Analytics: Scoped strictly to authenticated school tenant: **PASS**
- [x] School Admin Analytics: Attendance overview with rate, 7d/30d period toggle, and trend chart: **PASS**
- [x] School Admin Analytics: Academic performance with course offerings and published/draft/archived assignments status breakdown: **PASS**
- [x] School Admin Analytics: Pending administrative tasks and user invitations progress widgets: **PASS**
- [x] Security & Audit Monitoring: Cross-tenant Super Admin audit stream with category and date filters: **PASS**
- [x] Security & Audit Monitoring: Sanitized payload inspector modal redacting secrets: **PASS**
- [x] Settings & Governance: Super Admin verified platform security policies display: **PASS**
- [x] Settings & Governance: School Admin settings with metadata, active calendar link, preferences form, and tenant audit trail: **PASS**
- [x] Tenant Isolation & Zero Trust: Strict derivation of `schoolId` from session context with zero cross-tenant bleed: **PASS**
- [x] All automated tests pass: **PASS**

---

## 7. Known Limitations & Next Steps

- Push strictly to `feature/admin-portal` branch per repository branching conventions.
- Next Phase: Phase 8 (Backend Authentication, Session & User Activation hardening) pending human review and phase gate approval.
