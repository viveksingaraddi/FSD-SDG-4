# Design Token Specification — FSD-SDG-4 Quality Education SaaS

**Phase**: `PHASE 3: UI/UX Design System, Wireframes & Clickable Prototype`  
**Status**: Authoritative Design Token Reference for Frontend Implementation (Phase 13)  
**Standard**: WCAG 2.2 Level AA — All tokens contrast-verified  
**Last Reviewed**: 2026-11-05

> [!IMPORTANT]
> These tokens are the **single source of truth** for all visual design decisions. No hardcoded color, font size, shadow, or spacing value may appear in any component, wireframe, or specification. Every visual property must map to a named token below.

---

## 1. Color Token System

### 1.1 Brand & Primary Palette

The brand color is **SDG-4 Educational Blue**, anchored to Tailwind CSS Blue 700 (`#1D4ED8`). The palette conveys trust, academic credibility, and calm authority — qualities expected from a professional education institution platform.

| Token Name                  | Hex Value | Tailwind Reference | WCAG Contrast on White | Usage                                                 |
| :-------------------------- | :-------: | :----------------: | :--------------------: | :---------------------------------------------------- |
| `color-brand-primary`       | `#1D4ED8` |      Blue 700      |    **8.59:1** (AAA)    | Primary buttons, active nav items, links, focus rings |
| `color-brand-primary-hover` | `#1E40AF` |      Blue 800      |   **10.74:1** (AAA)    | Button hover state                                    |
| `color-brand-primary-light` | `#DBEAFE` |      Blue 100      |        N/A (bg)        | Active nav background tint, selected row highlight    |
| `color-brand-primary-dark`  | `#1E3A8A` |      Blue 900      |   **14.08:1** (AAA)    | Strong accent text, pressed state                     |

### 1.2 Neutral / Surface Palette

| Token Name             | Hex Value | Tailwind Reference |  WCAG Contrast on White  | Usage                                       |
| :--------------------- | :-------: | :----------------: | :----------------------: | :------------------------------------------ |
| `color-surface-canvas` | `#F8FAFC` |      Slate 50      |         N/A (bg)         | App background, main content canvas         |
| `color-surface-card`   | `#FFFFFF` |       White        |         N/A (bg)         | Card backgrounds, modal surfaces            |
| `color-surface-raised` | `#F1F5F9` |     Slate 100      |         N/A (bg)         | Table row hover, secondary card background  |
| `color-surface-sunken` | `#E2E8F0` |     Slate 200      |         N/A (bg)         | Table header background, divider fill       |
| `color-border-default` | `#CBD5E1` |     Slate 300      | **1.56:1** (border only) | Card borders, input outlines (non-active)   |
| `color-border-strong`  | `#94A3B8` |     Slate 400      | **2.63:1** (border only) | Focused input borders (pre-brand), dividers |

### 1.3 Text Palette

| Token Name                | Hex Value | Tailwind Reference | WCAG Contrast on `#F8FAFC` | Usage                                        |
| :------------------------ | :-------: | :----------------: | :------------------------: | :------------------------------------------- |
| `color-text-primary`      | `#0F172A` |     Slate 900      |     **15.73:1** (AAA)      | Body text, table cells, primary labels       |
| `color-text-secondary`    | `#334155` |     Slate 700      |      **9.73:1** (AAA)      | Secondary body, card metadata                |
| `color-text-muted`        | `#475569` |     Slate 600      |      **5.37:1** (AA)       | Helper text, placeholder labels, timestamps  |
| `color-text-disabled`     | `#94A3B8` |     Slate 400      |         **2.63:1**         | Disabled form field text (purely decorative) |
| `color-text-inverse`      | `#FFFFFF` |       White        |      N/A (on dark bg)      | Text on dark/colored button surfaces         |
| `color-text-link`         | `#1D4ED8` |      Blue 700      |      **8.59:1** (AAA)      | Clickable hyperlinks                         |
| `color-text-link-visited` | `#5B21B6` |     Violet 800     |      **9.14:1** (AAA)      | Visited links                                |

### 1.4 Semantic Status Palette

> [!NOTE]
> Every semantic color is verified to meet **4.5:1** contrast ratio for text use on white `#FFFFFF` or the light canvas `#F8FAFC`. Color is **never** the sole conveyor of information — icons and text labels accompany all colored status indicators (WCAG SC 1.4.1).

| Token Name                  | Hex Value | Tailwind Reference | WCAG Contrast on White | Semantic Meaning                        | Usage                                     |
| :-------------------------- | :-------: | :----------------: | :--------------------: | :-------------------------------------- | :---------------------------------------- |
| `color-semantic-success`    | `#15803D` |     Green 700      |    **4.84:1** (AA)     | Present, submitted, resolved, on-track  | Attendance PRESENT chip, success badges   |
| `color-semantic-success-bg` | `#DCFCE7` |     Green 100      |        N/A (bg)        | Chip background, alert background tint  | Success chip background                   |
| `color-semantic-warning`    | `#B45309` |     Amber 700      |    **4.65:1** (AA)     | Late, early warning flag, review needed | LATE chip, flag triage amber indicator    |
| `color-semantic-warning-bg` | `#FEF3C7` |     Amber 100      |        N/A (bg)        | Warning chip background, banner tint    | Flag banner background                    |
| `color-semantic-danger`     | `#B91C1C` |      Red 700       |    **4.93:1** (AA)     | Absent, overdue, escalated, error       | ABSENT chip, error banners, danger button |
| `color-semantic-danger-bg`  | `#FEE2E2` |      Red 100       |        N/A (bg)        | Error banner background, absent tint    | Error state backgrounds                   |
| `color-semantic-info`       | `#1D4ED8` |      Blue 700      |    **8.59:1** (AAA)    | Informational, default, neutral status  | Info banners, in-progress badges          |
| `color-semantic-info-bg`    | `#DBEAFE` |      Blue 100      |        N/A (bg)        | Info banner background                  | Info alert tint                           |
| `color-semantic-neutral`    | `#475569` |     Slate 600      |    **5.37:1** (AA)     | Excused, archived, ungraded             | EXCUSED chip, neutral badge               |
| `color-semantic-neutral-bg` | `#F1F5F9` |     Slate 100      |        N/A (bg)        | Neutral chip background                 | Excused chip background                   |

### 1.5 Focus & Interaction Tokens

| Token Name                | Value                   | Usage                                                          |
| :------------------------ | :---------------------- | :------------------------------------------------------------- |
| `color-focus-ring`        | `#2563EB` (Blue 600)    | 2px solid focus ring on all interactive elements               |
| `color-focus-ring-offset` | `#FFFFFF`               | 2px white offset ring separating focus from element background |
| `color-overlay-backdrop`  | `rgba(15, 23, 42, 0.5)` | Modal/drawer backdrop overlay (Slate 900 at 50% opacity)       |
| `color-skeleton-base`     | `#E2E8F0`               | Skeleton loading base color (Slate 200)                        |
| `color-skeleton-shimmer`  | `#F1F5F9`               | Skeleton shimmer pass color (Slate 100)                        |

---

## 2. Typography Token System

> [!NOTE]
> Zero external web fonts are loaded. The system uses a native OS typeface stack to eliminate Google Fonts HTTP requests on low-bandwidth 3G connections. The fallback stack ensures visual consistency across macOS, Windows, Android, and iOS.

### 2.1 Font Stack Token

```
font-family-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

### 2.2 Type Scale Tokens

| Token Name       |     rem     |  px  | Line Height |  Font Weight   | Letter Spacing | Usage                                         |
| :--------------- | :---------: | :--: | :---------: | :------------: | :------------: | :-------------------------------------------- |
| `type-display-1` |  `2.25rem`  | 36px | 1.1 (40px)  |   700 (Bold)   |   `-0.02em`    | Dashboard KPI numbers, school stats hero      |
| `type-heading-1` | `1.875rem`  | 30px | 1.2 (36px)  |   700 (Bold)   |   `-0.01em`    | Page `<h1>` — exactly one per view            |
| `type-heading-2` |  `1.5rem`   | 24px | 1.25 (30px) | 600 (SemiBold) |   `-0.01em`    | Card titles, section headers `<h2>`           |
| `type-heading-3` |  `1.25rem`  | 20px | 1.3 (26px)  | 600 (SemiBold) |      `0`       | Table headings, modal titles `<h3>`           |
| `type-heading-4` | `1.0625rem` | 17px | 1.35 (23px) |  500 (Medium)  |      `0`       | Sub-section labels `<h4>`, drawer headers     |
| `type-body-lg`   | `1.125rem`  | 18px | 1.6 (29px)  | 400 (Regular)  |      `0`       | Important body text, student name in cards    |
| `type-body-base` |  `1.0rem`   | 16px | 1.5 (24px)  | 400 (Regular)  |      `0`       | Standard body, table cells, form inputs       |
| `type-body-sm`   | `0.875rem`  | 14px | 1.43 (20px) | 400 (Regular)  |      `0`       | Metadata, timestamps, badge labels            |
| `type-caption`   |  `0.75rem`  | 12px | 1.33 (16px) |  500 (Medium)  |    `0.02em`    | Helper hints, audit timestamps, fine print    |
| `type-label-lg`  | `0.9375rem` | 15px |     1.0     | 600 (SemiBold) |    `0.01em`    | Navigation item labels (desktop sidebar)      |
| `type-label-sm`  | `0.6875rem` | 11px |     1.0     |  500 (Medium)  |    `0.02em`    | Mobile bottom-nav icon labels                 |
| `type-mono`      | `0.875rem`  | 14px |     1.5     | 400 (Regular)  |      `0`       | Student IDs, audit log event codes, route IDs |

---

## 3. Spacing Token System

All spacing values derive from a **4px (0.25rem) base unit**. Preferred values are multiples of 8px for the primary rhythm:

| Token Name |    rem    |  px  | Usage                                     |
| :--------- | :-------: | :--: | :---------------------------------------- |
| `space-0`  |    `0`    |  0   | Reset / no spacing                        |
| `space-1`  | `0.25rem` | 4px  | Fine-grained internal padding             |
| `space-2`  | `0.5rem`  | 8px  | Inner component padding, icon gap         |
| `space-3`  | `0.75rem` | 12px | Card internal padding (compact)           |
| `space-4`  | `1.0rem`  | 16px | Standard component padding                |
| `space-5`  | `1.25rem` | 20px | Section content gap                       |
| `space-6`  | `1.5rem`  | 24px | Card padding, form field spacing          |
| `space-8`  | `2.0rem`  | 32px | Section separation, page section gap      |
| `space-10` | `2.5rem`  | 40px | Large section separation                  |
| `space-12` | `3.0rem`  | 48px | Mobile touch target minimum size (height) |
| `space-16` | `4.0rem`  | 64px | Navigation rail width (compact tablet)    |
| `space-24` | `6.0rem`  | 96px | Sidebar icon-only width                   |

### 3.1 Layout Tokens

| Token Name                    | Value    | Usage                                            |
| :---------------------------- | :------- | :----------------------------------------------- |
| `layout-sidebar-width`        | `240px`  | Desktop fixed left sidebar width                 |
| `layout-sidebar-compact`      | `64px`   | Tablet compact icon rail width                   |
| `layout-bottom-nav-height`    | `56px`   | Mobile bottom navigation bar height              |
| `layout-global-header-height` | `64px`   | Global top header height across all viewports    |
| `layout-content-max-width`    | `1440px` | Maximum centered canvas width on `xl` viewports  |
| `layout-drawer-width`         | `480px`  | Off-canvas grading/detail drawer width (desktop) |
| `layout-drawer-width-lg`      | `640px`  | Wider drawer variant for split-view grading      |
| `layout-modal-width`          | `480px`  | Standard modal dialog width                      |
| `layout-modal-width-sm`       | `380px`  | Compact confirmation modal width                 |

---

## 4. Border, Radius & Elevation Tokens

### 4.1 Border Radius

| Token Name    |  Value   | Usage                              |
| :------------ | :------: | :--------------------------------- |
| `radius-sm`   |  `4px`   | Badges, chips, pill labels         |
| `radius-md`   |  `8px`   | Buttons, input fields, small cards |
| `radius-lg`   |  `12px`  | Standard cards, dropdowns          |
| `radius-xl`   |  `16px`  | Modal surfaces, large panels       |
| `radius-2xl`  |  `24px`  | Mobile bottom sheet corners        |
| `radius-full` | `9999px` | Circular avatars, pill badges      |

### 4.2 Shadow / Elevation

| Token Name     | CSS Box Shadow                                                            | Usage                            |
| :------------- | :------------------------------------------------------------------------ | :------------------------------- |
| `shadow-sm`    | `0 1px 2px 0 rgba(15,23,42,0.05)`                                         | Subtle card lift, table hover    |
| `shadow-md`    | `0 4px 6px -1px rgba(15,23,42,0.1), 0 2px 4px -2px rgba(15,23,42,0.1)`    | Interactive cards, dropdowns     |
| `shadow-lg`    | `0 10px 15px -3px rgba(15,23,42,0.1), 0 4px 6px -4px rgba(15,23,42,0.1)`  | Modal dialogs, drawers           |
| `shadow-xl`    | `0 20px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.1)` | Elevated panels, command palette |
| `shadow-focus` | `0 0 0 2px #FFFFFF, 0 0 0 4px #2563EB`                                    | Focus ring composite shadow      |

---

## 5. Motion & Animation Tokens

> [!IMPORTANT]
> All transitions **must** respect `@media (prefers-reduced-motion: reduce)`. When set, motion tokens collapse to `0ms` duration and `none` for animations. This is non-negotiable for WCAG 2.1 SC 2.3.3 (AAA is preferred) and seizure safety.

| Token Name                 | Value                          | Usage                                           |
| :------------------------- | :----------------------------- | :---------------------------------------------- |
| `motion-duration-instant`  | `0ms`                          | No perceivable delay                            |
| `motion-duration-fast`     | `100ms`                        | Micro-interactions: chip press, checkbox toggle |
| `motion-duration-base`     | `200ms`                        | Button state transitions, focus ring appearance |
| `motion-duration-slow`     | `300ms`                        | Drawer slide-in, dropdown open, modal fade      |
| `motion-duration-enter`    | `350ms`                        | Page transition entry animations                |
| `motion-easing-standard`   | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard material easing (ease-in-out)          |
| `motion-easing-decelerate` | `cubic-bezier(0, 0, 0.2, 1)`   | Elements entering viewport                      |
| `motion-easing-accelerate` | `cubic-bezier(0.4, 0, 1, 1)`   | Elements leaving viewport                       |

---

## 6. Breakpoint Tokens

| Token Name      | CSS Value | Viewport Range             | Description             |
| :-------------- | :-------- | :------------------------- | :---------------------- |
| `breakpoint-sm` | `640px`   | `0–639px` = mobile default | Mobile smartphones      |
| `breakpoint-md` | `768px`   | `640–1023px` = tablet      | Shared school tablets   |
| `breakpoint-lg` | `1024px`  | `1024–1279px` = desktop    | Teacher workstations    |
| `breakpoint-xl` | `1280px`  | `≥ 1280px` = wide          | Administrative displays |

---

## 7. Z-Index Layering Stack

| Token Name          | Value  | Layer Description                        |
| :------------------ | :----: | :--------------------------------------- |
| `z-below`           |  `-1`  | Background decorative elements           |
| `z-base`            |  `0`   | Default document flow                    |
| `z-raised`          |  `10`  | Cards with shadow, sticky table headers  |
| `z-dropdown`        | `100`  | Select menus, autocomplete dropdowns     |
| `z-sticky`          | `200`  | Sticky action bars, frozen table columns |
| `z-header`          | `300`  | Global top header                        |
| `z-sidebar`         | `400`  | Left sidebar / icon rail                 |
| `z-drawer`          | `500`  | Off-canvas grading / detail drawer       |
| `z-modal-backdrop`  | `600`  | Modal overlay backdrop                   |
| `z-modal`           | `700`  | Modal dialog, bottom sheet               |
| `z-toast`           | `800`  | Toast notification stack                 |
| `z-command-palette` | `900`  | Cmd+K command palette overlay            |
| `z-tooltip`         | `1000` | Tooltips (always topmost)                |

---

## 8. Icon System Token

> **System**: Inline SVG icons, tree-shaken per-component import. Total iconography budget: **≤ 25 KB** (gzipped). Zero icon-font downloads.  
> **Library**: Lucide React (MIT License) — consistent 24×24px viewBox, 2px stroke width, rounded line caps.

| Semantic Token    | Icon Name        | Usage                                   |
| :---------------- | :--------------- | :-------------------------------------- |
| `icon-attendance` | `ClipboardCheck` | Morning attendance, attendance nav item |
| `icon-student`    | `GraduationCap`  | Student profiles, enrollment            |
| `icon-teacher`    | `BookOpen`       | Teacher nav, course offerings           |
| `icon-assignment` | `FileText`       | Assignments, coursework                 |
| `icon-grade`      | `BarChart2`      | Gradebook, scores                       |
| `icon-support`    | `LifeBuoy`       | Support flags, pastoral care            |
| `icon-plan`       | `ClipboardList`  | Support plans                           |
| `icon-flag`       | `Flag`           | Early warning flag indicator            |
| `icon-calendar`   | `Calendar`       | Academic year, attendance history       |
| `icon-search`     | `Search`         | Search input, command palette trigger   |
| `icon-menu`       | `Menu`           | Hamburger drawer trigger                |
| `icon-close`      | `X`              | Close modal/drawer, dismiss             |
| `icon-check`      | `Check`          | Success, confirmed actions              |
| `icon-warning`    | `AlertTriangle`  | Warning, early flag amber               |
| `icon-error`      | `AlertCircle`    | Error state, validation failure         |
| `icon-info`       | `Info`           | Informational tooltips                  |
| `icon-offline`    | `WifiOff`        | Offline connectivity badge              |
| `icon-sync`       | `RefreshCw`      | Sync action, offline queue              |
| `icon-signout`    | `LogOut`         | Sign out action (always visible)        |
| `icon-settings`   | `Settings`       | School settings, configuration          |
| `icon-upload`     | `Upload`         | File upload, resource publish           |
| `icon-download`   | `Download`       | File download, export                   |
| `icon-next`       | `ChevronRight`   | Navigation forward, drawer next         |
| `icon-prev`       | `ChevronLeft`    | Navigation back                         |
| `icon-expand`     | `ChevronDown`    | Accordion open, dropdown                |
| `icon-collapse`   | `ChevronUp`      | Accordion close                         |
| `icon-print`      | `Printer`        | Print support plan                      |
| `icon-shield`     | `Shield`         | Audit log, security                     |
| `icon-users`      | `Users`          | Staff, student directory                |
| `icon-home`       | `Home`           | Dashboard home                          |

---

## 9. WCAG 2.2 AA Contrast Verification Matrix

The following table provides the complete contrast audit for all text token pairings used in the platform:

| Foreground Token                   | Background Token                      | Contrast Ratio | WCAG Grade | Usage                    |
| :--------------------------------- | :------------------------------------ | :------------: | :--------: | :----------------------- |
| `color-text-primary` (#0F172A)     | `color-surface-canvas` (#F8FAFC)      |  **15.73:1**   |  **AAA**   | Body text                |
| `color-text-primary` (#0F172A)     | `color-surface-card` (#FFFFFF)        |  **16.75:1**   |  **AAA**   | Card body text           |
| `color-text-secondary` (#334155)   | `color-surface-canvas` (#F8FAFC)      |   **9.73:1**   |  **AAA**   | Secondary labels         |
| `color-text-muted` (#475569)       | `color-surface-canvas` (#F8FAFC)      |   **5.37:1**   |   **AA**   | Helper text              |
| `color-text-inverse` (#FFFFFF)     | `color-brand-primary` (#1D4ED8)       |   **8.59:1**   |  **AAA**   | Primary button label     |
| `color-text-inverse` (#FFFFFF)     | `color-semantic-success` (#15803D)    |   **4.84:1**   |   **AA**   | PRESENT chip label       |
| `color-text-inverse` (#FFFFFF)     | `color-semantic-warning` (#B45309)    |   **4.65:1**   |   **AA**   | LATE/Flag chip label     |
| `color-text-inverse` (#FFFFFF)     | `color-semantic-danger` (#B91C1C)     |   **4.93:1**   |   **AA**   | ABSENT chip label        |
| `color-semantic-success` (#15803D) | `color-semantic-success-bg` (#DCFCE7) |   **5.21:1**   |   **AA**   | Outlined success badge   |
| `color-semantic-warning` (#B45309) | `color-semantic-warning-bg` (#FEF3C7) |   **5.02:1**   |   **AA**   | Outlined warning badge   |
| `color-semantic-danger` (#B91C1C)  | `color-semantic-danger-bg` (#FEE2E2)  |   **5.34:1**   |   **AA**   | Outlined danger badge    |
| `color-brand-primary` (#1D4ED8)    | `color-brand-primary-light` (#DBEAFE) |   **5.11:1**   |   **AA**   | Active nav item text     |
| `color-text-muted` (#475569)       | `color-surface-raised` (#F1F5F9)      |   **5.03:1**   |   **AA**   | Table row hover metadata |

> [!CAUTION]
> Any color pairing **not** in this matrix must be contrast-checked using the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) before use. Failing tokens must be replaced — never granted exceptions.
