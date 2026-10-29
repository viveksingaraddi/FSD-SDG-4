# Information Architecture and Navigational Model

This document specifies the global information architecture, taxonomy, mental models, and structural navigation hierarchies for the **FSD-SDG-4 Quality Education SaaS** frontend application.

---

## 1. Navigational Philosophy: Teacher-First & Context-Aware

The user interface avoids traditional, sprawling ERP menu trees. Instead, it organizes educational tasks around **context-aware daily actions**:

```text
[ Global Top Header: Tenant School Logo | Active Academic Year | User Profile & Sign Out ]
─────────────────────────────────────────────────────────────────────────────────────────
[ Role-Scoped Navigation Bar / Sidebar ]
  ├── Teacher:   [ Dashboard ] [ My Classes & Attendance ] [ Coursework & Grading ] [ Student Support Queue ]
  ├── Admin:     [ Dashboard ] [ Academic Calendar ] [ Classes & Rosters ] [ Staff & Students ] [ Audit ]
  ├── Student:   [ Dashboard ] [ My Subjects & Resources ] [ Assignments Due ] [ Grades & Feedback ]
  └── Parent:    [ Child Overview ] [ Attendance History ] [ Grades & Growth ] [ Active Support Goals ]
─────────────────────────────────────────────────────────────────────────────────────────
[ Main Content Canvas: Breadcrumb | Page Title & Badges | Primary Action Canvas ]
```

---

## 2. Core Taxonomy and Conceptual Entities

1. **Academic Scoping**: All institutional data is visually anchored to the **Active Academic Year** displayed in the global shell header.
2. **Classroom Context**: For teachers, work centers on **Class Sections** (e.g. *Grade 8-A*). Selecting a section reveals its daily attendance ledger, course syllabus, assignments, and enrolled student roster.
3. **Student Profile**: Clicking any student opens a standardized **Student Progress View** combining:
   - Longitudinal attendance rate chip (e.g. `92% Attendance`).
   - Cumulative coursework completion bar.
   - Active or proposed **Support Flags & Plans** highlighted in clear, non-punitive cards.
4. **Intervention Center**: A centralized pastoral care view where teachers and counselors triage proposed flags, author support plans, and execute scheduled milestone reviews.
