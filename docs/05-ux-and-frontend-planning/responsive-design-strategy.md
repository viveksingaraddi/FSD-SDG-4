# Responsive Design and Viewport Strategy

This document establishes the responsive design standards, mobile-first breakpoint rules, and adaptive data display strategies for the **FSD-SDG-4 Quality Education SaaS** frontend.

---

## 1. Breakpoint Hierarchy

The layout system is built strictly **mobile-first** using standard responsive breakpoints:

| Breakpoint Name | Viewport Width | Target Hardware Profiles | Primary Layout Behavior |
| :--- | :--- | :--- | :--- |
| **`sm` (Mobile)** | `< 640px` | Low-end Android smartphones, iPhones. | Single-column stack, sticky bottom action bar, card-based tables. |
| **`md` (Tablet)** | `640px - 1023px` | Tablets, shared school iPads, netbooks. | Two-column grid, compact icon sidebar, responsive scroll tables. |
| **`lg` (Desktop)**| `1024px - 1279px`| School office laptops, staffroom PCs. | Full sidebar navigation, multi-column dashboard, dense data tables. |
| **`xl` (Wide)** | `$\ge 1280px$` | High-resolution desktop monitors. | Centered maximum container width ($1440\text{px}$) to preserve readability. |

---

## 2. Adaptive Data Display: Desktop Tables to Mobile Cards

Complex educational data views (such as the morning attendance roster and student gradebook) cannot simply be shrunk on mobile screens without destroying usability. We enforce adaptive rendering:

### 2.1 Morning Attendance Roster
- **Desktop (`>= 1024px`)**: Rendered as a structured tabular grid with fixed columns:
  `[ Student Photo | ID | Full Name | Attendance Status Chips (P / A / L / E) | Quick Remarks ]`
- **Mobile (`< 640px`)**: Transformed into **Finger-Friendly Roster Cards**:
  - Each card represents one student.
  - Large $48\text{px}$ segmented status toggle buttons for `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.
  - Sticky bottom submission button (*"Submit Roster: 29 Present, 2 Absent"*) allowing one-thumb operation.

### 2.2 Gradebook Overview
- **Desktop**: Multi-column matrix with frozen student name column and horizontal scroll across assignments.
- **Mobile**: Collapses into an accordion grouped by student or assessment category, preventing illegible horizontal squishing.
