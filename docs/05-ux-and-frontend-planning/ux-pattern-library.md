# Universal UX Pattern Library and Interaction Guidelines

This document establishes the standard, reusable user experience patterns, interaction guidelines, and behavioral conventions across all roles in the **FSD-SDG-4 Quality Education SaaS** frontend.

Every pattern is engineered to satisfy **WCAG 2.2 Level AA**, optimize for low-bandwidth mobile environments, and respect educator task speed budgets.

---

## 1. Adaptive Data Display: Desktop Table to Mobile Card Transformation

Educational workflows deal heavily with multi-column tabular data (attendance rosters, gradebooks, staff lists, student directories). On desktop, tables provide density; on mobile, squeezed tables are illegible.

### 1.1 Transformation Specification

```text
DESKTOP VIEWPORT (>= 1024px)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Photo │ Student ID │ Student Name   │ Status Chips         │ Longitudinal │ Remarks    │
├───────┼────────────┼────────────────┼──────────────────────┼──────────────┼────────────┤
│ [Img] │ STU-0012   │ Jane Doe       │ (P)  [A]  (L)  (E)   │ 94% (Good)   │ [Add Note] │
│ [Img] │ STU-0013   │ John Smith     │ [P]  (A)  (L)  (E)   │ 72% (Alert)  │ [Add Note] │
└────────────────────────────────────────────────────────────────────────────────────────┘

MOBILE VIEWPORT (< 640px)
┌────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Img] Jane Doe                 ID: STU-0012        │ │
│ │ Attendance: 94% (On Track)                         │ │
│ │ ┌───────────┬───────────┬───────────┬────────────┐ │ │
│ │ │  PRESENT  │ [ ABSENT ]│   LATE    │  EXCUSED   │ │ │
│ │ └───────────┴───────────┴───────────┴────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Img] John Smith               ID: STU-0013        │ │
│ │ Attendance: 72% (Support Flag Active)              │ │
│ │ ┌───────────┬───────────┬───────────┬────────────┐ │ │
│ │ │[ PRESENT ]│  ABSENT   │   LATE    │  EXCUSED   │ │ │
│ │ └───────────┴───────────┴───────────┴────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 1.2 Rules for Mobile Card Adaptation:

1. **Touch Targets**: Each status toggle segmented button enforces a minimum dimension of **$48 \times 44\text{px}$**.
2. **Visual Hierarchy**: Student full name is prominent (`heading-3`, $18\text{px}$ bold); secondary IDs are subdued (`caption`, $12\text{px}$).
3. **Card Spacing**: $12\text{px}$ margin between cards to prevent accidental taps on neighboring student records.

---

## 2. Filter Toolbar and Faceted Search Pattern

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search student or ID...     ]  [Status: All ▾]  [Tier: All ▾]  [Clear Filters (2)] │
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ Active Filters: [Status: Unmarked ✕] [Section: 8-A ✕]                Showing 4 of 32   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Debounced Search**: Search input debounces at $300\text{ms}$ to prevent excessive API invocations or client filtering thrashing.
2. **URL State Synchronization**: Active filters sync to URL query parameters (`?status=unmarked&sectionId=8-A`), enabling refresh resilience and shareable deep-links.
3. **Screen Reader Announcement**: Filter result count updates announce via an off-screen live region (`<div role="status" aria-live="polite">Showing 4 of 32 students</div>`).

---

## 3. Form Layout, Inline Validation, and Error Summaries

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Please correct the 2 errors highlighted below before submitting.                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Assignment Title *                                                                     │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Mid-Term Geometry Quiz                                                             │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ Helper: Enter a descriptive title visible to students and parents.                     │
│                                                                                        │
│ Maximum Score *                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ -5                                                                                 │ │ ⚠️ Invalid score
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ⛔ Score must be a positive integer between 1 and 100.                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Explicit Label Association**: Every field strictly pairs a `<label for="fieldId">` with an `<input id="fieldId">`.
2. **Inline Error Delivery**: Errors display immediately beneath the affected input, referenced via `aria-describedby="fieldId-error"`. The input receives `aria-invalid="true"`.
3. **Top Error Summary**: When form submission fails validation, keyboard focus is automatically shifted to a prominent error summary banner at the top of the form (`tabindex="-1"`), announcing the total error count to screen readers.

---

## 4. Off-Canvas Drawer vs. Interruptive Modal Decision Matrix

To ensure educators maintain spatial context, the platform enforces strict criteria for choosing between a sliding drawer and a centered modal dialog:

| Dimension             | Off-Canvas Drawer (`Drawer`)                                                                | Centered Modal Dialog (`Modal`)                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| **Typical Usage**     | Grading submission review; student profile deep-dive; conflict reconciliation.              | Delete confirmation; flag dismissal justification note; session timeout warning.     |
| **Context Retention** | **High**: Underlying data table remains partially visible; educator maintains row position. | **Focused**: Completely covers background; intended to interrupt and force decision. |
| **Width on Desktop**  | $480\text{px} - 640\text{px}$ anchored to right edge.                                       | $400\text{px} - 540\text{px}$ centered in viewport.                                  |
| **Mobile Behavior**   | Expands to full-width sheet with swipe-down gesture.                                        | Full-width bottom sheet with fixed action buttons.                                   |
| **Keyboard Dismiss**  | `Escape` key immediately closes drawer; returns focus to trigger row.                       | `Escape` key closes modal; returns focus to trigger button.                          |

---

## 5. Destructive Action Safety & Type-to-Confirm Pattern

To prevent accidental deletions of student records, academic years, or published assignments:

### 5.1 Low-Impact Actions (e.g. Discard Draft)

- Standard accessible modal: _"Discard unsaved assignment draft?"_ with `[Cancel]` and `[Discard]`.

### 5.2 High-Impact / Permanent Destructive Actions (e.g. Archive Academic Year, Delete Subject)

- Requires **Type-to-Confirm** verification:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Danger: Archive Academic Year 2025-2026                                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ This action will freeze all gradebooks, archive rosters, and transition the school     │
│ into the new academic year. This cannot be undone automatically.                       │
│                                                                                        │
│ Type "ARCHIVE 2025-2026" in the box below to enable confirmation:                      │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                                    │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│ [Cancel]                                            [Permanently Archive (Disabled)]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

The confirm button remains disabled until the exact confirmation string is entered.

---

## 6. Toast Notifications and Live Announcements

1. **Semantic Role**: Toasts render inside a dedicated container marked `role="region" aria-label="Notifications"`.
2. **Polite Announcement**: Messages declare `role="status"` and `aria-live="polite"` so screen readers finish their current sentence before announcing the notification.
3. **Auto-Dismiss & Hover Pause**:
   - Success toasts auto-dismiss after $5000\text{ms}$.
   - Pointer hover or keyboard focus pauses the countdown timer, ensuring users with reading difficulties have sufficient time.
   - Actionable toasts include an explicit accessible dismiss button (`aria-label="Dismiss notification"`).

---

## 7. Geometry-Preserving Skeleton Loading

To eliminate Cumulative Layout Shift (CLS), loading skeletons precisely mirror the physical dimensions of the eventual loaded content:

- Table skeletons render identical column counts, widths, and row heights.
- Card skeletons display grey placeholder rectangles for avatars ($40 \times 40\text{px}$), title text ($18\text{px}$ height), and status chips.
- Skeletons use subtle CSS opacity pulsing (`@media (prefers-reduced-motion: reduce)` disables animations, rendering static grey shapes).

---

## 8. Empty States and Recovery Guidance

Empty states must never leave the user wondering if the system is broken:

1. **Engaging Illustration**: Clean, accessible SVG illustration related to the domain (e.g. a smiling book icon for no pending assignments).
2. **Encouraging Copy**: Avoid cold technical phrases (_"0 records returned"_). Use affirmative phrasing (_"All caught up! All homework assignments are completed."_).
3. **Clear Primary Call-to-Action**: If the user has permission to create records, render a prominent CTA button (e.g. `[Create First Assignment]`).
