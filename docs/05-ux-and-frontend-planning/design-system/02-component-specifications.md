# Component Design Specifications — FSD-SDG-4 Quality Education SaaS

**Phase**: `PHASE 3: UI/UX Design System, Wireframes & Clickable Prototype`  
**Status**: Authoritative Figma-Ready Component Specification  
**Standard**: WCAG 2.2 Level AA — WAI-ARIA Authoring Practices Guide  
**Last Reviewed**: 2026-11-05

> [!IMPORTANT]
> This document defines the visual design, state variations, anatomy, and accessibility contract for every Tier 1 (Base UI Primitive) and Tier 2 (Layout & Feedback) component. Figma component frames must implement these specifications exactly. When Figma is available, each section's specifications translate directly to a named Figma component with auto-layout, variant properties, and documented ARIA semantics.

---

## 1. Button Component

### 1.1 Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Leading Icon?]  [Label Text]  [Trailing Icon?]  [Loading Spinner?]│
└─────────────────────────────────────────────────────────────────────┘
     optional          required        optional          optional
```

### 1.2 Variants × States Matrix

| Variant          | Default                                          | Hover         | Focused                    | Active/Pressed | Loading                   | Disabled                     |
| :--------------- | :----------------------------------------------- | :------------ | :------------------------- | :------------- | :------------------------ | :--------------------------- |
| **Primary**      | `bg: #1D4ED8` / `text: #FFF`                     | `bg: #1E40AF` | `bg: #1D4ED8` + focus ring | `bg: #1E3A8A`  | Spinner + `opacity: 0.85` | `bg: #94A3B8` / `text: #FFF` |
| **Secondary**    | `bg: #FFF` / `border: #CBD5E1` / `text: #0F172A` | `bg: #F1F5F9` | Focus ring on border       | `bg: #E2E8F0`  | Spinner + `opacity: 0.85` | `opacity: 0.5`               |
| **Danger**       | `bg: #B91C1C` / `text: #FFF`                     | `bg: #991B1B` | Focus ring (red)           | `bg: #7F1D1D`  | Spinner                   | `bg: #94A3B8`                |
| **Ghost**        | `bg: transparent` / `text: #1D4ED8`              | `bg: #DBEAFE` | Focus ring                 | `bg: #BFDBFE`  | Spinner                   | `opacity: 0.5`               |
| **Danger Ghost** | `bg: transparent` / `text: #B91C1C`              | `bg: #FEE2E2` | Focus ring (red)           | `bg: #FECACA`  | —                         | `opacity: 0.5`               |

### 1.3 Size Specifications

| Size | Height | Horizontal Padding |       Font Token        | Min Width | Icon Size |
| :--: | :----: | :----------------: | :---------------------: | :-------: | :-------: |
| `sm` |  32px  |        12px        |  `type-body-sm` (14px)  |   72px    |  16×16px  |
| `md` |  40px  |        16px        | `type-body-base` (16px) |   96px    |  18×18px  |
| `lg` |  48px  |        20px        |  `type-body-lg` (18px)  |   120px   |  20×20px  |

> **Mobile Touch Target Rule**: On viewports `< 768px`, ALL buttons must have a minimum clickable bounding box of **44×44px** regardless of visual size. Apply `padding` or transparent hit-area extension to meet this requirement.

### 1.4 Accessibility Contract

```
HTML:   <button type="button" aria-busy="false" disabled={isDisabled}>
ARIA:   aria-busy="true" when loading; aria-disabled="true" for soft-disabled
Focus:  outline: 2px solid #2563EB; outline-offset: 2px;
Label:  Icon-only buttons MUST have aria-label="[action description]"
```

---

## 2. Input Field Component

### 2.1 Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│  Label *                                           [Required badge] │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ [Leading Icon]  Placeholder or value text            [Clear ✕] │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ⓘ Helper text (muted)                                             │
│  ⛔ Error message text (danger red)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 States

| State         | Border Color          | Background | Label Color | Helper/Error Area            |
| :------------ | :-------------------- | :--------- | :---------- | :--------------------------- |
| **Default**   | `#CBD5E1` (Slate 300) | `#FFFFFF`  | `#334155`   | Helper: `#475569`            |
| **Focused**   | `#2563EB` (Blue 600)  | `#FFFFFF`  | `#1D4ED8`   | Helper: `#475569`            |
| **Filled**    | `#94A3B8` (Slate 400) | `#FFFFFF`  | `#334155`   | Helper: `#475569`            |
| **Error**     | `#B91C1C` (Red 700)   | `#FFF5F5`  | `#B91C1C`   | Error: `#B91C1C` + `⛔` icon |
| **Disabled**  | `#E2E8F0` (Slate 200) | `#F8FAFC`  | `#94A3B8`   | Helper: `#94A3B8`            |
| **Read-Only** | `#E2E8F0` dashed      | `#F8FAFC`  | `#334155`   | Helper: `#475569`            |

### 2.3 Specifications

- **Height**: 44px (enforces mobile touch target minimum)
- **Border radius**: `radius-md` (8px)
- **Font**: `type-body-base` (16px) — prevents iOS Safari auto-zoom (font ≥ 16px requirement)
- **Internal padding**: 12px horizontal, 10px vertical
- **Required indicator**: Red asterisk `*` immediately after label (not inside input) with `aria-required="true"`

### 2.4 Accessibility Contract

```html
<div class="field-wrapper">
  <label for="field-email" class="field-label">
    Email Address <span aria-hidden="true" class="required-star">*</span>
  </label>
  <input
    id="field-email"
    type="email"
    name="email"
    aria-required="true"
    aria-describedby="field-email-helper field-email-error"
    aria-invalid="false"
    autocomplete="email"
  />
  <p id="field-email-helper" class="helper-text">Use your institutional email address.</p>
  <p id="field-email-error" role="alert" class="error-text" hidden>
    ⛔ Please enter a valid email address.
  </p>
</div>
```

---

## 3. Badge / Chip Component

Badges convey contextual semantic status and are used pervasively in attendance chips, support tiers, and enrollment status.

### 3.1 Badge Variants (Filled)

| Variant   | Background | Text Color | Usage                             |
| :-------- | :--------: | :--------: | :-------------------------------- |
| `success` | `#15803D`  | `#FFFFFF`  | PRESENT, Submitted, Resolved      |
| `warning` | `#B45309`  | `#FFFFFF`  | LATE, Proposed flag, Under Review |
| `danger`  | `#B91C1C`  | `#FFFFFF`  | ABSENT, Overdue, Escalated        |
| `info`    | `#1D4ED8`  | `#FFFFFF`  | Active, In Progress               |
| `neutral` | `#475569`  | `#FFFFFF`  | EXCUSED, Archived, Draft          |

### 3.2 Badge Variants (Outlined / Soft)

| Variant        | Background |  Border   | Text Color | Usage                                        |
| :------------- | :--------: | :-------: | :--------: | :------------------------------------------- |
| `success-soft` | `#DCFCE7`  | `#15803D` | `#15803D`  | On-Track attendance rate, term-level grade   |
| `warning-soft` | `#FEF3C7`  | `#B45309` | `#B45309`  | Early warning indicator (non-punitive amber) |
| `danger-soft`  | `#FEE2E2`  | `#B91C1C` | `#B91C1C`  | Critical flag, failed grade                  |
| `neutral-soft` | `#F1F5F9`  | `#94A3B8` | `#475569`  | Inactive status, provisional label           |

### 3.3 Size Specifications

|       Size        | Height | Horizontal Padding |       Font Token        | Icon Size |
| :---------------: | :----: | :----------------: | :---------------------: | :-------: |
|       `sm`        |  20px  |        6px         |  `type-caption` (12px)  |  12×12px  |
|       `md`        |  24px  |        8px         |  `type-body-sm` (14px)  |  14×14px  |
|       `lg`        |  32px  |        10px        | `type-body-base` (16px) |  16×16px  |
| `attendance-chip` |  48px  |        12px        |  `type-body-base` bold  |  18×18px  |

> **Attendance Chip Special Rule**: The `attendance-chip` size enforces the **48px minimum mobile touch target** requirement from the responsive design strategy. Used exclusively for PRESENT / ABSENT / LATE / EXCUSED interactive segmented controls.

### 3.4 Accessibility Contract

```
Non-interactive badges: <span role="status"> or bare <span> with aria-label
Interactive chips (attendance): <button aria-pressed="true|false" aria-label="Mark [Student Name] as PRESENT">
Color + icon + text: All three must be present simultaneously (SC 1.4.1)
```

---

## 4. Modal Dialog Component

### 4.1 Anatomy

```
┌─ Backdrop (rgba(15,23,42,0.5), z-index: 600) ──────────────────────┐
│                                                                     │
│    ┌─ Modal Surface (bg: #FFF, radius: 16px, shadow-xl) ─────────┐  │
│    │ ✕ [Close Button]                               aria-label   │  │
│    │                                                             │  │
│    │  [Modal Title - type-heading-2]  ←── id="modal-title"      │  │
│    │  [Optional description text]     ←── id="modal-desc"       │  │
│    │  ─────────────────────────────────────────────────────────  │  │
│    │                                                             │  │
│    │  [Modal Body Content]                                       │  │
│    │                                                             │  │
│    │  ─────────────────────────────────────────────────────────  │  │
│    │  [Secondary Action Button]      [Primary Action Button]    │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Specifications

- **Width**: 480px desktop / 100% mobile (bottom sheet)
- **Max height**: 80vh with internal scroll (`overflow-y: auto`) on body section
- **Border radius**: `radius-xl` (16px) desktop; `radius-2xl` (24px) top corners for mobile bottom sheet
- **Backdrop**: `rgba(15, 23, 42, 0.5)` — Slate 900 at 50% opacity
- **Entry animation**: Fade in from `opacity: 0` + slight `translateY(8px)` → `translateY(0)`, `300ms ease-out`
- **Mobile behavior**: Slides up from bottom, full-width, bottom-safe-area padding

### 4.3 Accessibility Contract

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
  tabindex="-1"
>
  <!-- Focus trap: Tab cycles within modal only -->
  <!-- Escape key: closes modal, restores focus to trigger element -->
  <!-- Backdrop click: closes modal (configurable for destructive modals) -->
  <!-- aria-hidden="true" on background content while modal is open -->
</div>
```

**Focus Management Rules**:

1. On open: focus moves to first focusable element inside (or modal container itself)
2. Tab cycling: wraps within modal, never escaping to background
3. On close: focus returns to the element that triggered the modal

---

## 5. Off-Canvas Drawer Component

### 5.1 Anatomy (Right-Anchored — Grading Drawer)

```
┌─ App Canvas (partially visible, inert) ──┬─ Drawer Surface ────────────┐
│                                          │  ┌─────────────────────────┐│
│  Attendance Roster Table                 │  │ [←] [Drawer Title]  [✕] ││
│  Row 1: Jane Doe  ...                    │  │ ───────────────────────  ││
│  Row 2: John Smith [ACTIVE] ...          │  │                         ││
│  Row 3: ...                              │  │  [Drawer Body Content]  ││
│                                          │  │  Submission details,    ││
│                                          │  │  score input, feedback  ││
│                                          │  │                         ││
│                                          │  │ ─────────────────────── ││
│                                          │  │ [Prev]  3/32  [Next]   ││
│                                          │  │ [Save Grade & Feedback] ││
│                                          └──┴─────────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

### 5.2 Specifications

- **Width**: 480px default / 640px wide variant (`layout-drawer-width-lg`) for grading split view
- **Slide animation**: `transform: translateX(100%)` → `translateX(0)`, `300ms ease-out`
- **Background**: Semi-transparent overlay on main content (not full-block backdrop)
- **Mobile**: Expands to full 100vw, slides up from bottom, with swipe-down-to-dismiss gesture
- **Close triggers**: `Escape` key, `✕` button, overlay click (unless form has unsaved state)

### 5.3 Accessibility Contract

```
role="dialog", aria-modal="true", aria-labelledby="drawer-title"
Focus trap: same as Modal
Background canvas: inert="true" or aria-hidden="true"
Swipe-down-to-dismiss: paired with accessible button alternative
```

---

## 6. Toast Notification Component

### 6.1 Anatomy

```
┌─ Toast Container (fixed, top-right or bottom-center, z-index: 800) ──┐
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ [✓ Icon]  [Message text]                      [✕ Dismiss]     │  │
│  │           Attendance recorded: 30 Present, 2 Absent           │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Toast Variants

| Variant   |       Icon        | Background |     Border-Left     | Usage                       |
| :-------- | :---------------: | :--------: | :-----------------: | :-------------------------- |
| `success` |     `✓ Check`     | `#DCFCE7`  | `4px solid #15803D` | Positive confirmations      |
| `warning` | `⚠ AlertTriangle` | `#FEF3C7`  | `4px solid #B45309` | Non-critical alerts         |
| `error`   | `⛔ AlertCircle`  | `#FEE2E2`  | `4px solid #B91C1C` | Action failed, retry needed |
| `info`    |     `ℹ Info`      | `#DBEAFE`  | `4px solid #1D4ED8` | Neutral informational       |

### 6.3 Behavior Rules

- **Position**: Bottom-center on mobile (thumb-reachable); Top-right on desktop (non-intrusive)
- **Auto-dismiss**: 5000ms for success; 8000ms for warning/error (more time to read)
- **Hover/Focus Pause**: Timer pauses when mouse hovers or keyboard focus enters toast
- **Queue stacking**: Maximum 3 toasts visible simultaneously; queues additional notifications
- **Animation**: Slides in from edge over 200ms; fades out over 150ms

### 6.4 Accessibility Contract

```html
<!-- Container region — persistent in DOM -->
<div role="region" aria-label="Notifications" aria-live="polite" aria-atomic="false">
  <!-- Individual toast -->
  <div role="status" class="toast toast-success">
    <span aria-hidden="true">✓</span>
    <p>Attendance recorded: 30 Present, 2 Absent</p>
    <button aria-label="Dismiss notification">✕</button>
  </div>
</div>
```

---

## 7. Skeleton Loading Component

### 7.1 Specifications

Skeletons must **exactly mirror** the geometry of the content they represent to prevent Cumulative Layout Shift (CLS):

| Skeleton Element | Dimensions   | Shape         | Usage                         |
| :--------------- | :----------- | :------------ | :---------------------------- |
| Avatar circle    | 40×40px      | `radius-full` | Student/teacher profile photo |
| Short text line  | 120px × 14px | `radius-sm`   | Name, label                   |
| Medium text line | 220px × 14px | `radius-sm`   | Subtitle, metadata            |
| Long text line   | 100% × 14px  | `radius-sm`   | Body paragraph                |
| Card block       | 100% × 80px  | `radius-lg`   | Standard card placeholder     |
| Table row        | 100% × 48px  | 0px           | Table body row                |
| Metric tile      | 100% × 100px | `radius-lg`   | Dashboard KPI tile            |
| Chart block      | 100% × 180px | `radius-lg`   | Analytics chart area          |
| Chip             | 72px × 24px  | `radius-full` | Badge/status chip             |

### 7.2 Animation Specification

```css
/* Shimmer animation */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,
    /* color-skeleton-base */ #f1f5f9 50%,
    /* color-skeleton-shimmer */ #e2e8f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: #e2e8f0; /* Static base color only */
  }
}
```

---

## 8. Segmented Toggle / Attendance Chip Component

This is the highest-frequency interaction component in the entire platform (used for every student row during morning attendance).

### 8.1 Anatomy (Mobile Card — Attendance)

```
┌── Attendance Chip Group (fieldset) ──────────────────────────────────┐
│  legend (visually hidden): "Attendance status for Jane Doe"          │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ [✓] PRESENT│  │ [✕] ABSENT │  │ [⏱] LATE  │  │ [○]EXCUSED │    │
│  │ (selected) │  │            │  │            │  │            │    │
│  │  h: 48px   │  │  h: 48px   │  │  h: 48px   │  │  h: 48px   │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 State Specifications

| Chip Status            | Background | Border        | Text      | Icon              | ARIA                   |
| :--------------------- | :--------- | :------------ | :-------- | :---------------- | :--------------------- |
| **PRESENT** (selected) | `#15803D`  | none          | `#FFFFFF` | `✓ Check`         | `aria-pressed="true"`  |
| **PRESENT** (default)  | `#F8FAFC`  | `1px #CBD5E1` | `#475569` | `✓ Check` (muted) | `aria-pressed="false"` |
| **ABSENT** (selected)  | `#B91C1C`  | none          | `#FFFFFF` | `✕ X`             | `aria-pressed="true"`  |
| **LATE** (selected)    | `#B45309`  | none          | `#FFFFFF` | `⏱ Clock`         | `aria-pressed="true"`  |
| **EXCUSED** (selected) | `#475569`  | none          | `#FFFFFF` | `○ Circle`        | `aria-pressed="true"`  |

### 8.3 Keyboard Navigation

```
Arrow Right / Arrow Left: Cycle between chip options within the group
Space / Enter: Activate focused chip
Tab: Move to next student's chip group
Escape: Deselect and return to previous state
```

### 8.4 Accessibility Contract

```html
<fieldset class="attendance-chip-group">
  <legend class="sr-only">Attendance status for Jane Doe (STU-0012)</legend>

  <button
    type="button"
    aria-pressed="true"
    class="chip chip-present chip-selected"
    aria-label="Mark Jane Doe as Present"
  >
    <svg aria-hidden="true"><!-- check icon --></svg>
    PRESENT
  </button>

  <button type="button" aria-pressed="false" aria-label="Mark Jane Doe as Absent">
    <svg aria-hidden="true"><!-- x icon --></svg>
    ABSENT
  </button>
  <!-- ... LATE, EXCUSED ... -->
</fieldset>
```

---

## 9. Data Table Component

### 9.1 Anatomy (Desktop)

```
┌── Table Container ───────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ [Filter Bar] [Search] [Status Filter ▾] [Clear (2)]   32 rows  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────┬──────────┬─────────────┬──────────────┬────────────┬──────┐ │
│  │ [□] │ Photo    │ Student ID  │ Student Name │ Status     │ Rate │ │  ← thead: scope="col"
│  ├─────┼──────────┼─────────────┼──────────────┼────────────┼──────┤ │
│  │ [□] │ [Avatar] │ STU-0012   │ Jane Doe     │ [Present●] │ 94%  │ │
│  │ [□] │ [Avatar] │ STU-0013   │ John Smith   │ [Absent ●] │ 72%  │ │
│  └─────┴──────────┴─────────────┴──────────────┴────────────┴──────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ [← Prev]  Page 1 of 2  [Next →]       Showing 1–25 of 32      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2 Specifications

- **Row height**: 56px (desktop) / 72px (tablet, more breathing room)
- **Header background**: `color-surface-sunken` (#E2E8F0)
- **Row hover**: `color-surface-raised` (#F1F5F9) with `shadow-sm` transition
- **Selected row**: `color-brand-primary-light` (#DBEAFE) background
- **Striping**: Optional alternating `#F8FAFC` / `#FFFFFF` for dense data
- **Frozen column**: First column (name/ID) sticks with `position: sticky; left: 0` on horizontal scroll
- **Overflow**: Horizontal scroll container with visible scrollbar indicator

### 9.3 Accessibility Contract

```html
<table>
  <caption class="sr-only">
    Student attendance roster — Section 8-A, 2026-11-05
  </caption>
  <thead>
    <tr>
      <th scope="col"><input type="checkbox" aria-label="Select all students" /></th>
      <th scope="col">Student Name</th>
      <th scope="col">Status</th>
      <th scope="col">Attendance Rate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><input type="checkbox" aria-label="Select Jane Doe" /></td>
      <td>Jane Doe</td>
      <!-- ... -->
    </tr>
  </tbody>
</table>
<div role="status" aria-live="polite" class="sr-only">Showing 25 of 32 students</div>
```

---

## 10. Command Palette Component (`Cmd+K`)

### 10.1 Anatomy

```
┌─ Backdrop ─────────────────────────────────────────────────────────┐
│                                                                     │
│    ┌─ Command Palette ─────────────────────────────────────────┐   │
│    │  🔍 [Type to search or choose an action...]    [Esc]      │   │
│    │  ──────────────────────────────────────────────────────── │   │
│    │  QUICK ACTIONS                                            │   │
│    │  ┌──────────────────────────────────────────────────────┐ │   │
│    │  │ [📋] Take Attendance — Section 8-A                   │ │   │
│    │  │ [📝] New Assignment — Grade 8 Mathematics             │ │   │
│    │  │ [🏳] Draft Support Plan                              │ │   │
│    │  └──────────────────────────────────────────────────────┘ │   │
│    │  STUDENTS                                                 │   │
│    │  ┌──────────────────────────────────────────────────────┐ │   │
│    │  │ [👤] Jane Doe  STU-0012  •  94%  •  No Active Flags  │ │   │
│    │  └──────────────────────────────────────────────────────┘ │   │
│    └───────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Specifications

- **Trigger**: `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) — global keydown listener
- **Width**: 640px (desktop); 100vw - 32px margin (mobile)
- **Max height**: 480px with internal virtual scroll for results
- **Search debounce**: 150ms (faster than standard 300ms — this is a keyboard shortcut context)
- **Result sections**: Grouped with section headings (Quick Actions, Students, Sections, Commands)
- **Background**: `blur(8px)` on backdrop for glass-morphism depth effect

### 10.3 Accessibility Contract

```html
<div
  role="combobox"
  aria-expanded="true"
  aria-haspopup="listbox"
  aria-controls="cmd-palette-results"
  aria-activedescendant="result-1"
>
  <input type="text" aria-label="Search or enter a command" autocomplete="off" spellcheck="false" />
</div>
<ul id="cmd-palette-results" role="listbox" aria-label="Search results">
  <li role="option" id="result-1" aria-selected="true">Take Attendance — Section 8-A</li>
</ul>
```

---

## 11. Empty State Component

### 11.1 Anatomy

```
┌── Empty State Container (centered, max-width: 400px) ──────────────┐
│                                                                     │
│              [SVG Illustration — Domain-Appropriate]               │
│               (160×160px; accessible with aria-hidden)             │
│                                                                     │
│           [Headline: type-heading-2, text-primary]                 │
│           [Body copy: type-body-base, text-muted]                  │
│                                                                     │
│              [Primary CTA Button — if user has permission]         │
│              [Secondary text link — optional]                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Empty State Catalog

| Screen                      | Illustration Theme     | Headline                 | Body                                               | CTA                 |
| :-------------------------- | :--------------------- | :----------------------- | :------------------------------------------------- | :------------------ |
| Teacher Dashboard           | Smiling sun / calendar | "All caught up!"         | "No pending attendance or unreviewed flags."       | —                   |
| Attendance Roster           | Empty clipboard        | "No students enrolled"   | "Contact your administrator to enroll students."   | [Contact Admin]     |
| Support Queue               | Green checkmark        | "All students on track!" | "Zero unreviewed early warning flags."             | —                   |
| Assignment List             | Stacked papers         | "No assignments yet"     | "Create your first assignment for this course."    | [Create Assignment] |
| Student Gradebook           | Bar chart              | "No grades recorded"     | "Grades will appear after assignments are graded." | —                   |
| Student Dashboard (holiday) | Celebration stars      | "No classes today!"      | "Enjoy your break — see you next school day."      | —                   |

### 11.3 Accessibility Contract

```html
<section aria-label="[Context] is empty">
  <img src="empty-illustration.svg" alt="" role="presentation" aria-hidden="true" />
  <h2>All students on track!</h2>
  <p>Zero unreviewed early warning flags across your assigned sections.</p>
  <!-- CTA if applicable -->
</section>
```

---

## 12. Navigation Components

### 12.1 Desktop Sidebar Navigation

```
Width: 240px | Background: #FFFFFF | Border-right: 1px solid #E2E8F0

┌─ Sidebar ─────────────────────────────┐
│  [School Logo]  Apex High School      │  ← 64px header area
│  ─────────────────────────────────── │
│  [🏠] Dashboard                       │  ← Active: bg #DBEAFE, text #1D4ED8
│  [📋] Attendance (Today)    [2 pending]│  ← Alert badge: danger filled
│  [📚] Classes & Rosters               │
│  [📝] Coursework & Grades             │
│  [🏳] Support Plans            [4]   │  ← Warning badge: amber filled
│  [📖] Resource Library                │
│  ─────────────────────────────────── │
│  [⚙] School Settings                 │
│  [?] Help & Shortcuts                 │
│                                       │
│  v1.0.0 • 🟢 Online                  │  ← 32px footer
│  [⎋ Sign Out ──────────────────────] │  ← Always visible, danger ghost
└───────────────────────────────────────┘
```

### 12.2 Mobile Bottom Navigation

```
Height: 56px | Background: #FFFFFF | Border-top: 1px solid #E2E8F0
Safe-area padding: env(safe-area-inset-bottom)

┌────────────┬────────────┬────────────┬────────────┐
│   🏠       │   📋 ●     │   📝       │   🏳 ●    │
│  Home      │ Attendance │  Grading   │  Support   │
│            │  (active)  │            │  (badge:4) │
└────────────┴────────────┴────────────┴────────────┘
   48×48px       48×48px      48×48px       48×48px
```

### 12.3 Navigation Accessibility Contract

```html
<nav aria-label="Primary navigation">
  <ul role="list">
    <li>
      <a href="/teacher/dashboard" aria-current="page" class="nav-item nav-item--active">
        <svg aria-hidden="true"><!-- icon --></svg>
        <span class="nav-label">Dashboard</span>
      </a>
    </li>
    <!-- ... -->
  </ul>
</nav>

<!-- Mobile bottom nav -->
<nav aria-label="Mobile navigation" class="bottom-nav">
  <!-- Same pattern, icons + labels, aria-current -->
</nav>
```

---

## 13. Breadcrumb Component

### 13.1 Anatomy

```
Desktop:
┌────────────────────────────────────────────────────────────────────┐
│  Home  /  Classes  /  Section 8-A  /  Morning Attendance           │
│  (link)   (link)       (link)          (current page — no link)    │
└────────────────────────────────────────────────────────────────────┘

Mobile (<640px): Collapses to single back link
┌────────────────────────────────────────────────────────────────────┐
│  ← Section 8-A                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 13.2 Accessibility Contract

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/teacher/dashboard">Home</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="/teacher/classes">Classes</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="/teacher/classes/sec8a">Section 8-A</a></li>
    <li aria-hidden="true">/</li>
    <li><span aria-current="page">Morning Attendance</span></li>
  </ol>
</nav>
```

---

## 14. Skip Link Component

The first focusable element on every page — mandatory WCAG SC 2.4.1:

```html
<a href="#main-content" class="skip-link"> Skip to main content </a>

<!-- CSS: visible only on focus -->
.skip-link { position: absolute; top: -100%; left: 16px; z-index: 9999; padding: 8px 16px;
background: #1D4ED8; color: #FFFFFF; border-radius: 0 0 8px 8px; font-weight: 600; text-decoration:
none; transition: top 200ms ease; } .skip-link:focus { top: 0; outline: 2px solid #FFFFFF;
outline-offset: 2px; }
```
