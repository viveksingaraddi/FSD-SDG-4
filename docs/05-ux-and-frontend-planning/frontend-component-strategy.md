# Frontend Component Strategy, Composition and Architecture

This document establishes the component hierarchy, composition patterns, prop interfaces, and directory organization for the **FSD-SDG-4 Quality Education SaaS** React application.

---

## 1. Architectural Component Tiers

Components are organized into three distinct architectural layers to enforce separation of concerns, maximize reusability, and prevent cyclic dependencies:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Tier 1: Base UI Primitives (`src/components/ui`)                                       │
│ Domain-agnostic, headless or lightly styled, accessible HTML5 + ARIA atoms.            │
│ Examples: Button, Input, Select, Checkbox, Modal, Drawer, Badge, Toast, Skeleton.      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Layout & Feedback Units (`src/components/layout`, `src/components/feedback`)   │
│ Application wrappers, responsive app shells, navigation bars, error boundaries.        │
│ Examples: AppShell, GlobalHeader, BottomNav, SidebarNav, Breadcrumbs, ErrorBoundary.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Domain Feature Modules (`src/features/*`)                                      │
│ Vertical feature slices encapsulating domain business logic, queries, and UI widgets.  │
│ Examples: AttendanceRosterGrid, SubmissionGradingDrawer, SupportFlagTriageCard.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Base UI Primitives (`src/components/ui`)

Every primitive adheres strictly to WAI-ARIA authoring guidelines and enforces strict TypeScript typing:

| Component Name        | Underlying HTML           | Essential ARIA Attributes                               | Key TypeScript Props Interface                                                                                                       |
| :-------------------- | :------------------------ | :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| **`Button`**          | `<button>`                | `aria-busy`, `disabled`                                 | `variant: 'primary' \| 'secondary' \| 'danger' \| 'ghost'`, `size: 'sm' \| 'md' \| 'lg'`, `isLoading?: boolean`                      |
| **`Input`**           | `<input>`                 | `aria-invalid`, `aria-describedby`                      | `label: string`, `error?: string`, `helperText?: string`, `name: string`, `type?: string`                                            |
| **`Select`**          | `<select>`                | `aria-invalid`, `aria-required`                         | `label: string`, `options: Array<{label: string, value: string}>`, `error?: string`                                                  |
| **`SegmentedToggle`** | `<fieldset>` / `<button>` | `aria-pressed`, `role="radiogroup"`                     | `name: string`, `options: Array<{value: string, label: string, color?: string}>`, `value: string`, `onChange: (val: string) => void` |
| **`Modal`**           | `<dialog>` / `<div>`      | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | `isOpen: boolean`, `onClose: () => void`, `title: string`, `description?: string`, `children: React.ReactNode`                       |
| **`Drawer`**          | `<div>` (Off-canvas)      | `role="dialog"`, `aria-modal="true"`                    | `isOpen: boolean`, `onClose: () => void`, `position: 'right'`, `title: string`, `children: React.ReactNode`                          |
| **`Badge`**           | `<span>`                  | `role="status"`                                         | `variant: 'success' \| 'warning' \| 'danger' \| 'neutral'`, `children: React.ReactNode`                                              |
| **`Toast`**           | `<div>`                   | `role="status"`, `aria-live="polite"`                   | `type: 'success' \| 'warning' \| 'error' \| 'info'`, `message: string`, `duration?: number`, `onDismiss: () => void`                 |

---

## 3. Domain Feature Component Slices (`src/features/*`)

Feature components are grouped by domain to mirror the educational closed loop ($\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$):

### 3.1 Attendance Feature (`src/features/attendance`)

- **`AttendanceRosterGrid`**: Desktop tabular grid with inline status toggles.
- **`AttendanceStudentCard`**: Mobile card with large $48\text{px}$ touch chips.
- **`AttendanceSubmitBar`**: Sticky bottom summary bar (_"30 Present, 2 Absent"_).
- **`OfflineSyncDrawer`**: Interactive conflict resolution interface for queued offline rosters.

### 3.2 Coursework & Grading Feature (`src/features/grading`)

- **`AssignmentEditorForm`**: Coursework authoring form with markdown instructions and rubric attachments.
- **`SubmissionGradingDrawer`**: Off-canvas review drawer with split document preview, numeric score input, qualitative feedback textarea, and rapid keyboard hotkey transitions (`Cmd+Enter`).
- **`GradebookMatrixTable`**: Consolidated section gradebook with frozen identity column and virtualized score cells.

### 3.3 Student Support Feature (`src/features/support`)

- **`SupportFlagTriageCard`**: Transparent early warning card displaying trigger evidence, attendance rate, and Confirm / Dismiss actions.
- **`DismissFlagModal`**: High-contrast dialog enforcing mandatory educator dismissal justification note ($\ge 15$ characters).
- **`SupportPlanWizard`**: Multi-step wizard drafting SMART goals, action item assignments, and mandatory milestone review dates.
- **`MilestoneReviewModal`**: Outcome evaluation dialog recording `RESOLVED`, `CONTINUED`, or `ESCALATED` status with longitudinal notes.

---

## 4. State Management and Server Query Strategy

1. **Server State (TanStack Query)**:
   - All server data fetching, caching, invalidation, and optimistic updates use TanStack Query hooks (e.g. `useAttendanceRoster(sectionId, date)`, `useSupportQueue()`).
   - Mutations use optimistic UI updates with automatic rollback upon API failure.
2. **Local Component State (`useState`, `useReducer`)**:
   - Strictly reserved for transient UI state: drawer open/close, active form tab, modal open status, search input query string.
3. **Global UI Shell Context**:
   - Thin React Context stores ambient shell parameters: active sidebar collapse state, offline network status, active school tenant branding.
4. **Zero Untyped Props**:
   - TypeScript `strict: true` is enforced across all components; use of `any` is strictly prohibited.
