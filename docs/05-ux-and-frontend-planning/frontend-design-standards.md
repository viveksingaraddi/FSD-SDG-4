# Frontend Design Standards — FSD-SDG-4 Quality Education SaaS

**Date**: 2026-11-12  
**Authoritative Token Source**: [`01-design-tokens.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/01-design-tokens.md) & [`02-component-specifications.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/02-component-specifications.md)  
**Target Standard**: WCAG 2.2 Level AA across all 5 roles (Platform Super Admin, School Administrator, Teacher, Student, Parent / Guardian)

> [!IMPORTANT]
> **Figma remains the approved design source of truth.** These standards operationalize the Phase 3 design system for future frontend implementation (Phase 13–14) without altering approved screens or introducing unapproved visual styles.

---

## 1. Visual Design Principles

- **Clean, Academic SaaS Aesthetic**: Prioritize clarity, high information legibility, and calm authority suitable for educators, students, and school administrators.
- **Anti-Cliché Guardrails**: Avoid generic AI-generated dashboard aesthetics — no gratuitous neon/purple gradients, no decorative glassmorphism/blur cards, and no unrequested 3D widgets.
- **Consistent System, Role-Specific Workflows**: All five roles share the exact same token system, component primitives, and feedback patterns while adapting navigation and task density to each role's workflows.
- **Explicit Microcopy**: Use clear, action-oriented labels (e.g., `"Save Attendance"`, `"Confirm Flag"`) rather than generic placeholders (`"Submit"`, `"OK"`).

---

## 2. Typography System

Per [`01-design-tokens.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/01-design-tokens.md), **zero external web fonts** are loaded to preserve fast rendering on low-bandwidth connections:

- **Font Stack (`font-family-sans`)**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Core Scale**:
  - `type-display-1`: `2.25rem` (`36px`), weight `700`, line-height `1.1` — Dashboard KPIs
  - `type-heading-1`: `1.875rem` (`30px`), weight `700`, line-height `1.2` — Page `<h1>` (strictly one per view)
  - `type-heading-2`: `1.5rem` (`24px`), weight `600`, line-height `1.25` — Section/card `<h2>`
  - `type-heading-3`: `1.25rem` (`20px`), weight `600`, line-height `1.3` — Table/modal `<h3>`
  - `type-heading-4`: `1.0625rem` (`17px`), weight `500`, line-height `1.35` — Drawer/sub-section `<h4>`
  - `type-body-base`: `1.0rem` (`16px`), weight `400`, line-height `1.5` — Standard body, forms, table cells
  - `type-body-sm`: `0.875rem` (`14px`), weight `400`, line-height `1.43` — Metadata, badges, timestamps
  - `type-caption`: `0.75rem` (`12px`), weight `500`, line-height `1.33` — Helper text and fine print
  - `type-mono`: `0.875rem` (`14px`), weight `400`, line-height `1.5` — Student IDs, audit codes, route IDs

---

## 3. Color System

All colors must map to named Phase 3 tokens (no hardcoded arbitrary hex values in components):

- **Brand Primary (SDG-4 Educational Blue)**:
  - `color-brand-primary`: `#1D4ED8` (Blue 700, `8.59:1` on white)
  - `color-brand-primary-hover`: `#1E40AF` (Blue 800, `10.74:1`)
  - `color-brand-primary-light`: `#DBEAFE` (Blue 100 — active nav tint)
  - `color-brand-primary-dark`: `#1E3A8A` (Blue 900, `14.08:1`)
- **Surfaces & Borders**:
  - `color-surface-canvas`: `#F8FAFC` (Slate 50)
  - `color-surface-card`: `#FFFFFF` (White)
  - `color-surface-raised`: `#F1F5F9` (Slate 100)
  - `color-surface-sunken`: `#E2E8F0` (Slate 200)
  - `color-border-default`: `#CBD5E1` (Slate 300) / `color-border-strong`: `#94A3B8` (Slate 400)
- **Text**:
  - `color-text-primary`: `#0F172A` (`15.73:1`), `color-text-secondary`: `#334155` (`9.73:1`), `color-text-muted`: `#475569` (`5.37:1`), `color-text-inverse`: `#FFFFFF`
- **Semantic Status** (always paired with text/icon, never color alone):
  - Success: `#15803D` on `#DCFCE7`
  - Warning: `#B45309` on `#FEF3C7`
  - Danger: `#B91C1C` on `#FEE2E2`
  - Info: `#1D4ED8` on `#DBEAFE`
  - Neutral: `#475569` on `#F1F5F9`

---

## 4. Spacing System

All spacing derives from a **4px (`0.25rem`) base unit** (`space-0` through `space-24`):

- `space-2` (`8px`): Inner component/icon gaps
- `space-4` (`16px`): Standard component padding
- `space-6` (`24px`): Card padding and form field spacing
- `space-8` (`32px`): Page section separation
- **Layout Dimensions**:
  - Desktop sidebar: `240px` | Tablet compact rail: `64px` | Mobile bottom nav: `56px`
  - Global header: `64px` | Content max-width: `1440px`
  - Drawers: `480px` / `640px` | Modals: `480px` / `380px`

---

## 5. Component Standards

- **Reusable Primitives**: Build Tier 1/Tier 2 components matching [`02-component-specifications.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/02-component-specifications.md) (Button, Input, Select, DataTable/Card, Badge, Modal, Drawer, Toast, EmptyState, Skeleton).
- **Mandatory Four States**: Every async view and data widget must implement explicit **Loading** (skeleton/spinner with `aria-busy`), **Empty** (clear guidance + next action), **Error** (RFC 7807 message + retry), and **Success** states.
- **Forms & Validation**: Use React Hook Form + Zod (`@fsd-sdg4/validation`) with inline field-level error messages linked via `aria-describedby`.
- **Human-in-the-Loop Safeguards**: Student support flags and intervention plans must always present explicit human confirmation controls and never render automated punitive labels.

---

## 6. Responsive Design Standards

- **Mobile-First Breakpoints**: Support mobile (`< 768px`), tablet (`768px–1023px`), and desktop (`>= 1024px`, max content `1440px`).
- **Touch Targets**: All interactive controls on mobile (`< 768px`) must have a minimum `44×44px` hit area.
- **Adaptive Data Display**: Dense desktop tables transform cleanly into structured mobile cards without horizontal page overflow.

---

## 7. Accessibility Standards (WCAG 2.2 AA)

- **Semantic HTML**: Use native `<button>`, `<nav>`, `<main>`, `<header>`, `<label>`, and proper heading hierarchy (single `<h1>` per page).
- **Focus Management**: Maintain visible `2px solid #2563EB` focus rings with `2px` white offset (`shadow-focus`), trap focus inside open modals/drawers, and restore focus on close.
- **Contrast & Non-Color Cues**: Maintain `>= 4.5:1` text contrast and `>= 3:1` UI/graphical contrast; pair status colors with icons and text labels (WCAG SC 1.4.1).
- **Screen-Reader Support**: Announce async state changes and toast notifications via `aria-live="polite"` / `role="alert"`.

---

## 8. Motion and Interaction Guidelines

- **Subtle & Purposeful**: Use fast, restrained transitions (`150ms–200ms`, `ease-out` for entrances, `ease-in` for exits) limited to compositor-friendly properties (`transform`, `opacity`).
- **No Decorative Motion**: Avoid bouncy, distracting, or continuous ambient animations that hinder classroom/low-end device usability.
- **Reduced Motion**: Always honor `@media (prefers-reduced-motion: reduce)` (`motion-reduce:` utilities in Tailwind) by disabling non-essential transitions.

---

## 9. Visual Testing Standards

1. **Unit & Component Tests**: Vitest + React Testing Library verifying rendered states (loading, empty, error, success), form validation, and ARIA attributes.
2. **E2E Browser Tests**: Playwright suites (`apps/web/e2e/`) covering critical role journeys across mobile and desktop viewports.
3. **Live Visual & Accessibility Audits**: Verify running screens in Chrome via the Antigravity `browser` subagent, `a11y-debugging` (keyboard navigation, contrast, focus rings, tap targets), and `debug-optimize-lcp` before marking any frontend phase complete.
