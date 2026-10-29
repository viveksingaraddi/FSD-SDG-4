# Frontend Component Strategy and Architecture

This document establishes the component hierarchy, composition patterns, prop typing standards, and directory organization for the **FSD-SDG-4 Quality Education SaaS** React application.

---

## 1. Component Architectural Tiers

Components are organized into three distinct architectural tiers:

```text
[ 1. Base UI Primitives ]       ──► Unstyled, headless, domain-agnostic accessible controls (Button, Modal, Input).
            │
            ▼
[ 2. Layout & Feedback Units ]   ──► Application shell, responsive headers, loading skeletons, error boundaries.
            │
            ▼
[ 3. Domain Feature Components ] ──► Domain-bound vertical slices (AttendanceRoster, SupportFlagCard, GradebookTable).
```

---

## 2. Base UI Primitives (`src/components/ui`)

Every primitive is built using accessible HTML5 semantics augmented with WAI-ARIA attributes:

| Component Name | Base HTML Element | ARIA Attributes | Key Props Interface |
| :--- | :--- | :--- | :--- |
| **`Button`** | `<button>` | `aria-busy`, `disabled` | `variant` (primary/secondary/danger), `size`, `isLoading` |
| **`Input`** | `<input>` | `aria-invalid`, `aria-describedby` | `label`, `error`, `helperText`, `name`, `type` |
| **`Select`** | `<select>` | `aria-invalid`, `aria-required` | `label`, `options: Array<{label, value}>`, `error` |
| **`Modal`** | `<dialog>` / `<div>` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | `isOpen`, `onClose`, `title`, `children` |
| **`Drawer`** | `<div>` (Off-canvas)| `role="dialog"`, `aria-modal="true"` | `isOpen`, `onClose`, `position`, `children` |
| **`Badge`** | `<span>` | `role="status"` | `variant` (success/warning/danger/neutral), `children` |
| **`Toast`** | `<div>` | `role="status"`, `aria-live="polite"`| `type`, `message`, `duration`, `onDismiss` |

---

## 3. Feedback and System State Components (`src/components/feedback`)

- **`EmptyState`**: Standardized fallback rendered when data arrays are empty:
  ```typescript
  interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: { label: string; onClick: () => void };
  }
  ```
- **`LoadingSkeleton`**: Geometry-preserving layout skeletons preventing Cumulative Layout Shift (CLS):
  ```typescript
  interface SkeletonProps {
    variant: 'text' | 'card' | 'table-row' | 'avatar';
    count?: number;
  }
  ```
- **`ErrorBoundary`**: React Class Component intercepting unhandled render errors, preventing white-screen crashes, and rendering a fallback view with a reload trigger.

---

## 4. Strict Typing and Composition Rules

1. **Zero `any` Annotations**: All component props, state hooks, and event handlers must be strictly typed via TypeScript interfaces.
2. **Prop Drilling Forbidden**: Deep prop drilling is replaced by React Context (for global shell state) or TanStack Query (for server state).
3. **Compound Components**: Complex domain widgets (e.g. `SupportPlanCard`) use compound component composition (`SupportPlanCard.Header`, `SupportPlanCard.ActionList`, `SupportPlanCard.Footer`) to maximize layout flexibility.
