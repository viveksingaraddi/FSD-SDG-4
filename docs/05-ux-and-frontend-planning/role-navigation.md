# Role Navigation Architecture, App Shell and Navigation Patterns

This document defines the responsive application shell layouts, navigation mechanics, role-specific menus, command palette shortcuts, and shared-terminal safety controls for the **FSD-SDG-4 Quality Education SaaS** frontend.

---

## 1. Responsive App Shell Layouts

The application shell adapts gracefully across three standard hardware profiles while preserving layout muscle memory, accessibility, and ergonomic thumb reach.

### 1.1 Desktop Workstation Layout ($\ge 1024\text{px}$)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Global Header: [School Logo + Name]  [Term: 2026-27 Active]  [Cmd+K Search]  [Alerts (3)]  [User] [Sign Out]│
├───────────────────────┬─────────────────────────────────────────────────────────────────────────────────┤
│ Fixed Vertical Nav    │ Main View Canvas                                                                │
│ (Width: 240px)        │ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│                       │ │ Breadcrumbs: Dashboard / Grade 8-A / Morning Attendance                     │ │
│ • Dashboard           │ ├─────────────────────────────────────────────────────────────────────────────┤ │
│ • Attendance (Today)  │ │ Page Header: Morning Attendance — Section 8-A                               │ │
│ • Classes & Rosters   │ │ Action Toolbar: [Mark All Present] [Filter: Unmarked] [Submit Roster (32)]  │ │
│ • Coursework & Grades │ ├─────────────────────────────────────────────────────────────────────────────┤ │
│ • Support Plans (4)   │ │                                                                             │ │
│ • Resource Library    │ │ Data Table / Roster Grid / Contextual Form                                  │ │
│                       │ │                                                                             │ │
│ ───────────────────── │ │                                                                             │ │
│ • School Settings     │ │                                                                             │ │
│ • Help & Shortcuts    │ └─────────────────────────────────────────────────────────────────────────────┘ │
│ [App v1.0.0 • Online] │                                                                                 │
└───────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tablet Layout ($768\text{px} - 1023\text{px}$)

- **Compact Icon Rail**: Collapses from $240\text{px}$ to a $64\text{px}$ vertical icon rail.
- **Hover & Focus Tooltips**: Accessible tooltips (`role="tooltip"`) display navigation labels upon pointer hover or keyboard focus.
- **Drawer Expansion**: Touching the hamburger toggle expands the rail into a full-width overlay drawer without resetting scroll state.

### 1.3 Mobile Smartphone Layout ($< 768\text{px}$)

- **Sticky Bottom Navigation Bar**: Houses the top four high-frequency tasks for the active role (height: $56\text{px}$, icons with $11\text{px}$ text labels, minimum tap target: $48 \times 48\text{px}$).
- **Sliding Hamburger Drawer**: Contains secondary routes (audit logs, institutional settings, resource libraries) and explicit shared-terminal logout.
- **Sticky Bottom Action Container**: High-urgency mutations (e.g. _"Submit Attendance: 30 Present, 2 Absent"_) dock above the bottom navigation bar to support one-handed thumb interaction.

---

## 2. Role Navigation Hierarchies

### 2.1 Teacher Navigation (Primary Pedagogical Persona)

- **Top Bar Badges**: Displays unsubmitted attendance rosters for today and pending early warning flags.
- **Mobile Bottom Bar (4 items)**:
  1. `Dashboard` (`/teacher/dashboard`)
  2. `Attendance` (`/teacher/classes/:activeSection/attendance`)
  3. `Grading` (`/teacher/assignments`)
  4. `Support` (`/teacher/support/queue` — displays amber badge if flags $> 0$)
- **Drawer Navigation**:
  - `My Classes & Rosters` (`/teacher/classes`)
  - `Course Resources` (`/teacher/course-offerings`)
  - `Consolidated Gradebook` (`/teacher/course-offerings/:id/gradebook`)
  - `Archived Support Plans` (`/teacher/support/plans`)
  - `Sign Out` (Destructive Red Outline)

### 2.2 School Administrator Navigation

- **Mobile Bottom Bar (4 items)**:
  1. `Dashboard` (`/school/dashboard`)
  2. `Classes` (`/school/classes`)
  3. `Staff` (`/school/staff`)
  4. `Students` (`/school/students`)
- **Drawer Navigation**:
  - `Academic Years & Terms` (`/school/academic-years`)
  - `Curriculum Subjects` (`/school/subjects`)
  - `Course Allocations` (`/school/offerings`)
  - `Support Analytics` (`/school/support-overview`)
  - `Security Audit Log` (`/school/audit-log`)
  - `School Settings & Branding` (`/school/settings`)
  - `Sign Out`

### 2.3 Student Navigation (Mobile-First Learner Persona)

- **Mobile Bottom Bar (4 items)**:
  1. `Home` (`/student/dashboard`)
  2. `Subjects` (`/student/courses`)
  3. `Tasks` (`/student/assignments` — displays red badge for tasks due $< 24\text{h}$)
  4. `My Growth` (`/student/progress`)
- **Drawer Navigation**:
  - `Study Materials` (`/student/courses/:id/resources`)
  - `Graded Work & Teacher Notes` (`/student/assignments?status=graded`)
  - `Sign Out`

### 2.4 Parent / Guardian Navigation (_Provisional - OQ-002_)

- **Child Selector Switcher**: Docked permanently in header when multiple children are enrolled.
- **Mobile Bottom Bar (4 items)**:
  1. `Overview` (`/parent/dashboard`)
  2. `Attendance` (`/parent/children/:studentId/attendance`)
  3. `Grades` (`/parent/children/:studentId/grades`)
  4. `Support Goals` (`/parent/children/:studentId/support-goals`)

### 2.5 Super Administrator Navigation

- **Mobile Bottom Bar (3 items)**:
  1. `Overview` (`/admin/dashboard`)
  2. `Schools` (`/admin/schools`)
  3. `Audit` (`/admin/system-logs`)

---

## 3. Global Header & Safety Controls

The Global Header is persistent across all views and provides essential ambient awareness and security:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡ Menu]  [Apex High School]  [Term: Term 1 (Active)]  🔍 Cmd+K  🔔(2)  [T. Adams ▾]  [⎋ Sign Out]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **School Branding & Term Badge**:
   - Displays school name and an accessible status chip for the active academic term (`Term 1 2026-27`).
   - If the school is in term rollover transition, an amber badge warning indicates _"Read-Only Historical View"_.
2. **Offline Connectivity Pill**:
   - When the device is offline, an amber badge appears: `[⚡ Offline — 2 Rosters Queued]`.
   - Clicking the pill opens the offline sync drawer.
3. **Emergency Shared-Device Sign Out Button**:
   - In shared school computer labs, users often leave terminals without logging out.
   - A dedicated high-contrast `[Sign Out]` button is permanently rendered in the header with `aria-label="Sign out immediately and clear local session"`.
   - Clicking triggers an instant session purge, cleans sensitive in-memory state, and redirects to `/login`.
4. **Session Timeout Warning Dialog**:
   - At 25 minutes of inactivity (5 minutes before the 30-minute server session expiry), an accessible modal triggers with countdown timer and audio chime.
   - Provides two clear actions: `[Stay Signed In]` (extends session via token refresh) and `[Sign Out Now]`.

---

## 4. Breadcrumb Navigation Model

Breadcrumbs provide a structural mental anchor, eliminating disorientation. The hierarchy strictly mirrors the information architecture:

- **Teacher Path**: `Dashboard > Classes > Section 8-A > Morning Attendance`
- **Grading Path**: `Dashboard > Grade 8 Math > Quadratic Equations > Grading Queue > Submissions`
- **Support Path**: `Dashboard > Student Support > Triage Queue > Flag #FL-082 (Jane Doe)`
- **Admin Path**: `Dashboard > Academic Setup > 2026-27 Terms > Term 1 Configuration`

### Breadcrumb Accessibility Rules:

- Structured inside `<nav aria-label="Breadcrumb">` with `<ol>`.
- The current page item uses `aria-current="page"` and is not clickable.
- Separators use CSS pseudo-elements (`::after`) or SVG icons marked `aria-hidden="true"`.

---

## 5. Universal Command Palette (`Cmd+K` / `Ctrl+K`)

To ensure teachers and administrators can navigate between classes, students, and support queues in under 2 seconds:

- **Keyboard Trigger**: Pressing `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) opens a modal combobox with autofocus.
- **Search Scope**:
  1. **Direct Navigation**: Type `attend` $\to$ lists all assigned sections with immediate links to today's attendance grid.
  2. **Student Lookup**: Type student name or ID $\to$ displays matching student profile cards with attendance and support badges.
  3. **Quick Actions**:
     - `Take Attendance (Grade 8-A)`
     - `New Assignment`
     - `Draft Support Plan`
     - `Sign Out`
- **A11y**: Built strictly to WAI-ARIA Combobox design patterns with keyboard arrow navigation, `aria-activedescendant`, and `Escape` to dismiss.
