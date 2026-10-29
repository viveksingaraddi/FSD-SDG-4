# Role Navigation Matrix and App Shell

This document defines the primary navigation layouts, mobile drawer behaviors, header controls, and breadcrumb trails for each role within the **FSD-SDG-4 Quality Education SaaS** frontend.

---

## 1. App Shell Architecture

The frontend uses a unified responsive **App Shell** layout supporting desktop workstations, tablets, and mobile smartphones:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Global Header: [Mobile Menu Toggle] [School Logo] [Term: 2026-27 Active]│
│                [Notification Bell] [User Name: Role] [Sign Out Button] │
├────────────────────────┬───────────────────────────────────────────────┤
│ Responsive Sidebar     │ Main View Canvas                              │
│ (Collapsible on mobile)│ ┌───────────────────────────────────────────┐ │
│                        │ │ Breadcrumb: Dashboard > Grade 8-A > Attend│ │
│ • Dashboard            │ ├───────────────────────────────────────────┤ │
│ • Morning Attendance   │ │ Page Title: Morning Attendance (Sec 8-A)  │ │
│ • Classes & Rosters    │ │ Action Bar: [Bulk Present] [Submit Roster]│ │
│ • Coursework & Grades  │ ├───────────────────────────────────────────┤ │
│ • Student Support (3)  │ │                                           │ │
│ • Profile & Settings   │ │ Content Table / Roster Grid / Cards       │ │
│                        │ │                                           │ │
│ [App Version 0.0.0]    │ └───────────────────────────────────────────┘ │
└────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Role Navigation Item Mappings

| Navigation Item | Target Route | Super Admin | School Admin | Teacher | Student | Parent (P1) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | `/:role/dashboard` | Yes | Yes | Yes | Yes | Yes |
| **School Tenants** | `/admin/schools` | **Yes** | — | — | — | — |
| **Academic Terms** | `/school/academic-years` | — | **Yes** | — | — | — |
| **Classes & Sections** | `/school/classes` | — | **Yes** | View | — | — |
| **Curriculum Subjects** | `/school/subjects` | — | **Yes** | View | — | — |
| **Staff Directory** | `/school/staff` | — | **Yes** | — | — | — |
| **Student Directory** | `/school/students` | — | **Yes** | View | — | — |
| **My Classes & Rosters**| `/teacher/classes` | — | — | **Yes** | — | — |
| **Daily Attendance** | `/teacher/classes/:id/attendance`| — | View | **Yes** | View Self | View Child |
| **Coursework & Tasks** | `/:role/assignments` | — | — | **Yes** | **Yes** | View Child |
| **Gradebook & Scores** | `/:role/gradebook` | — | View | **Yes** | View Self | View Child |
| **Support Queue & Plans**| `/:role/support` | — | View | **Yes** | View Self | View Child |
| **Audit Logs** | `/:role/audit-log` | **Yes** | **Yes** | — | — | — |

---

## 3. Responsive Navigational Patterns

1. **Desktop ($> 1024\text{px}$)**: Fixed left-hand vertical sidebar ($240\text{px}$ wide); visible labels and accessible SVG icons.
2. **Tablet ($768\text{px} - 1023\text{px}$)**: Collapsible icon-only rail ($64\text{px}$) with hover/focus tooltips; expands on click.
3. **Mobile ($< 768\text{px}$)**: Bottom navigation bar for top 4 high-frequency items (`Dashboard`, `Attendance`, `Coursework`, `Support`), plus a sliding hamburger drawer containing secondary settings and explicit logout.

---

## 4. Shared-Terminal Safety Features

- **Prominent Sign Out**: The "Sign Out" button is permanently docked in the header with high-contrast visual weight, ensuring staff and students on shared lab terminals can exit with a single click.
- **Session Timeout Dialog**: Appears 5 minutes prior to session expiry with an accessible countdown and audio/visual prompt.
