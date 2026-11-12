# Annotated Wireframe Specifications — FSD-SDG-4 Quality Education SaaS

**Phase**: `PHASE 3: UI/UX Design System, Wireframes & Clickable Prototype`  
**Status**: Authoritative Figma-Ready Wireframe Annotation Library  
**Scope**: All P0 screens across Teacher, Admin, Student, and Public portals  
**Standard**: WCAG 2.2 Level AA — Mobile-First Responsive  
**Last Reviewed**: 2026-11-05

> [!NOTE]
> Wireframes in this document use precise ASCII layout diagrams and annotated specifications. These are **Figma-ready blueprints**: each numbered annotation (`[A1]`, `[A2]`…) maps directly to a Figma annotation layer that the designer places over the wireframe frame. When Figma is available, every frame described here becomes a named Figma frame with autolayout, component instances, and prototype connections.

> [!IMPORTANT]
> **Figma Plugin Availability**: The Figma plugin is **not currently installed**. These specifications constitute the complete, production-ready visual design brief. To create the interactive prototype, install the Figma plugin from the marketplace and use this document as the authoring guide. All design decisions and dimensions herein are authoritative.

---

## Wireframe Index

| WF ID         | Screen                       | Route                              | Persona | Figma Frame Name            |
| :------------ | :--------------------------- | :--------------------------------- | :------ | :-------------------------- |
| **WF-PUB-01** | Sign In                      | `/login`                           | All     | `Auth / Sign In`            |
| **WF-TCH-01** | Teacher Dashboard            | `/teacher/dashboard`               | Teacher | `Teacher / Dashboard`       |
| **WF-TCH-02** | Morning Attendance Grid      | `/teacher/classes/:id/attendance`  | Teacher | `Teacher / Attendance`      |
| **WF-TCH-03** | Submission Grading Queue     | `/teacher/assignments/:id/grading` | Teacher | `Teacher / Grading Queue`   |
| **WF-TCH-04** | Grading Drawer               | `?drawer=:submissionId`            | Teacher | `Teacher / Grading Drawer`  |
| **WF-TCH-05** | Support Flags Triage Queue   | `/teacher/support/queue`           | Teacher | `Teacher / Support Queue`   |
| **WF-TCH-06** | Student Longitudinal Profile | `/teacher/students/:id`            | Teacher | `Teacher / Student Profile` |
| **WF-TCH-07** | Support Plan Creator Wizard  | `/teacher/support/plans/new`       | Teacher | `Teacher / Plan Wizard`     |
| **WF-ADM-01** | School Admin Dashboard       | `/school/dashboard`                | Admin   | `Admin / Dashboard`         |
| **WF-ADM-02** | Student Directory            | `/school/students`                 | Admin   | `Admin / Students`          |
| **WF-ADM-03** | Class & Section Setup        | `/school/classes`                  | Admin   | `Admin / Classes`           |
| **WF-STU-01** | Student Dashboard            | `/student/dashboard`               | Student | `Student / Dashboard`       |
| **WF-STU-02** | My Assignments               | `/student/assignments`             | Student | `Student / Assignments`     |
| **WF-STU-03** | Submit Assignment            | `/student/assignments/:id/submit`  | Student | `Student / Submit`          |
| **WF-STU-04** | My Progress                  | `/student/progress`                | Student | `Student / Progress`        |

---

## WF-PUB-01 — Sign In Screen

**Route**: `/login` | **Layout**: `AuthLayout` | **Figma Frame**: `Auth / Sign In`

### Desktop Wireframe (≥ 1024px)

```
┌─── Viewport (1440 × 900) ─────────────────────────────────────────────────────────────────┐
│                                                                                           │
│  ┌── Left Panel (bg: #1D4ED8, 50% width) ──────────────────────────────────────────────┐  │
│  │                                                                                     │  │
│  │        [A1] Platform SVG Illustration                                               │  │
│  │        (Classroom / students learning scene)                                        │  │
│  │        aria-hidden="true"                                                           │  │
│  │                                                                                     │  │
│  │        [A2] Tagline:                                                                │  │
│  │        "Empowering educators.                                                       │  │
│  │         Supporting every learner."                                                  │  │
│  │        type-heading-2, text: #FFFFFF                                                │  │
│  │                                                                                     │  │
│  │        [A3] SDG 4 Badge:                                                            │  │
│  │        🎯 Aligned with UN SDG 4 — Quality Education                                │  │
│  │        caption, text: rgba(255,255,255,0.8)                                        │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│  ┌── Right Panel (bg: #FFFFFF, 50% width) ─────────────────────────────────────────────┐  │
│  │                                                                                     │  │
│  │        [A4] Logo + School Name:                                                     │  │
│  │        [Logo SVG] FSD-SDG-4 Platform                                               │  │
│  │                                                                                     │  │
│  │        [A5] Page H1:                                                                │  │
│  │        "Sign in to your school portal"                                             │  │
│  │        type-heading-1, text-primary                                                 │  │
│  │                                                                                     │  │
│  │        ┌── [A6] Sign In Form Card (max-width: 420px) ────────────────────────┐    │  │
│  │        │                                                                       │    │  │
│  │        │  [Label] Email Address *                                             │    │  │
│  │        │  ┌─────────────────────────────────────────────────────────────────┐│    │  │
│  │        │  │ ✉ your@school.edu                                               ││    │  │
│  │        │  └─────────────────────────────────────────────────────────────────┘│    │  │
│  │        │                                                                       │    │  │
│  │        │  [Label] Password *                                                   │    │  │
│  │        │  ┌─────────────────────────────────────────────────────────────────┐│    │  │
│  │        │  │ ●●●●●●●●●●                                        [👁 Show]    ││    │  │
│  │        │  └─────────────────────────────────────────────────────────────────┘│    │  │
│  │        │                                                                       │    │  │
│  │        │  [A7] Error Banner (hidden by default):                              │    │  │
│  │        │  ⛔ Invalid email or password. Please try again.                   │    │  │
│  │        │  (bg: #FEE2E2, border: #B91C1C)                                     │    │  │
│  │        │                                                                       │    │  │
│  │        │  ┌─────────────────────────────────────────────────────────────────┐│    │  │
│  │        │  │          Sign In            [loading spinner if busy]           ││    │  │
│  │        │  └─────────────────────────────────────────────────────────────────┘│    │  │
│  │        │  (Primary button, full-width, height: 48px)                         │    │  │
│  │        │                                                                       │    │  │
│  │        │  [A8] Forgot password link (centered):                              │    │  │
│  │        │  Forgot your password? [Request a reset link →]                     │    │  │
│  │        │                                                                       │    │  │
│  │        └───────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                     │  │
│  │        [A9] Footer: "Need help? Contact your school IT administrator"            │  │
│  │        caption, text-muted, centered                                              │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Wireframe (<640px)

```
┌─── 390 × 844 (iPhone 14) ─────────────────────────────────────────┐
│  [A4] [Logo]  FSD-SDG-4 Platform                                  │  ← 64px header
│  ─────────────────────────────────────────────────────────────── │
│                                                                   │
│  [A5] Sign in to your school portal                               │
│       type-heading-1, centered                                    │
│                                                                   │
│  [A3] 🎯 SDG 4 Quality Education Platform                        │
│        badge-soft-info, centered                                  │
│                                                                   │
│  [Label] Email Address *                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ✉ your@school.edu                               h: 48px    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [Label] Password *                                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ●●●●●●●●●●                           [👁 Show]  h: 48px   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [A7] ⛔ Error banner (full-width if error)                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Sign In                     h: 52px       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [A8] Forgot your password? [Request a reset →]                  │
│       centered, text-link                                         │
│                                                                   │
│  [A9] Contact your school IT administrator                       │
│       caption, text-muted, centered, bottom of screen            │
└───────────────────────────────────────────────────────────────────┘
```

### Annotations

| ID  | Annotation              | Specification                                                                     |
| :-- | :---------------------- | :-------------------------------------------------------------------------------- |
| A1  | Left panel illustration | 400×400px SVG, `aria-hidden="true"`, purely decorative                            |
| A2  | Brand tagline           | `type-heading-2`, color `#FFFFFF`, max-width 360px                                |
| A3  | SDG badge               | `badge-soft-info`, visible on mobile, `aria-label="Aligned with UN SDG 4"`        |
| A4  | Logo area               | 40px height logo, text: `type-label-lg`, `alt="FSD-SDG-4 Platform logo"`          |
| A5  | Page H1                 | Exactly one `<h1>` per page; `type-heading-1`, `tabindex="-1"` for focus on error |
| A6  | Form card               | Max-width 420px, `role="form"`, `aria-label="Sign in form"`                       |
| A7  | Error banner            | `role="alert"`, `aria-live="assertive"`, hidden when no error                     |
| A8  | Forgot link             | `<a href="/forgot-password">`, plain text color, underlined                       |
| A9  | Footer note             | `type-caption`, `color-text-muted`, not a navigation element                      |

---

## WF-TCH-01 — Teacher Dashboard

**Route**: `/teacher/dashboard` | **Layout**: `TeacherLayout` | **Figma Frame**: `Teacher / Dashboard`

### Desktop Wireframe (≥ 1024px)

```
┌─── Global Header (height: 64px) ──────────────────────────────────────────────────────────┐
│ [≡]  [School Logo] Apex High School   [⚡ Online]   🔍 Cmd+K   🔔(2)   [Ms Adams ▾]   [⎋ Sign Out] │
└───────────────────────────────────────────────────────────────────────────────────────────┘
┌─── Sidebar (240px) ─────┬─── Main Canvas ───────────────────────────────────────────────┐
│ [🏠] Dashboard ● active │ [Skip to main content link — sr-only, visible on focus]        │
│ [📋] Attendance  [2]   │                                                                │
│ [📚] Classes            │  <nav aria-label="Breadcrumb">                                │
│ [📝] Coursework         │  Home                                                         │
│ [🏳] Support    [4]    │                                                                │
│ [📖] Resources          │  ┌─── [B1] Priority Alert Banner ───────────────────────────┐  │
│ ─────────────────────── │  │ ⚠ 2 sections have unsubmitted attendance for today.      │  │
│ [⚙] Settings           │  │ [Go to Section 8-A →]  [Go to Section 9-B →]            │  │
│ [?] Help                │  │ (bg: #FEF3C7, border-left: 4px #B45309)                  │  │
│                         │  └──────────────────────────────────────────────────────────┘  │
│ v1.0.0 • 🟢 Online     │                                                                │
│ [⎋ Sign Out ──────────] │  <h1>Educator Overview</h1>                                   │
│                         │                                                                │
│                         │  ┌─── [B2] Metric Summary Row (4 cards, equal width) ───────┐  │
│                         │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│                         │  │  │Today's   │ │Pending   │ │Support   │ │Students  │   │  │
│                         │  │  │Classes   │ │Grading   │ │Flags     │ │At Risk   │   │  │
│                         │  │  │    6     │ │   14     │ │    4     │ │    3     │   │  │
│                         │  │  │type-disp │ │type-disp │ │type-disp │ │type-disp │   │  │
│                         │  │  │ -1       │ │ -1       │ │ -1 amber │ │ -1 red   │   │  │
│                         │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│                         │  └──────────────────────────────────────────────────────────┘  │
│                         │                                                                │
│                         │  ┌─── [B3] Today's Schedule ────────┬─── [B4] Quick Actions ─┐│
│                         │  │  <h2>Today's Classes</h2>        │ <h2>Quick Actions</h2>  ││
│                         │  │                                   │                        ││
│                         │  │  ┌──────────────────────────┐    │ [📋 Take Attendance]   ││
│                         │  │  │ 08:00 | Grade 8 Math      │    │ Section 8-A ↗         ││
│                         │  │  │ Section 8-A | Room 201    │    │                        ││
│                         │  │  │ [Take Attendance ●]       │    │ [📝 Grade Submissions] ││
│                         │  │  │ Chip: danger "Not Marked" │    │ 14 pending ↗          ││
│                         │  │  └──────────────────────────┘    │                        ││
│                         │  │  ┌──────────────────────────┐    │ [🏳 Review Flags]     ││
│                         │  │  │ 10:00 | Grade 9 Science   │    │ 4 unreviewed ↗        ││
│                         │  │  │ Section 9-B | Room 115    │    │                        ││
│                         │  │  │ [Take Attendance ●]       │    │ [📖 Add Resources]    ││
│                         │  │  └──────────────────────────┘    │ Grade 8 Math ↗         ││
│                         │  │  ... (virtual scroll)             │                        ││
│                         │  └──────────────────────────────────┴────────────────────────┘│
│                         │                                                                │
│                         │  ┌─── [B5] Active Support Flag Summary ─────────────────────┐  │
│                         │  │  <h2>Pending Flag Review (4)</h2>                        │  │
│                         │  │  ┌───────────────────────────────────────────────────┐   │  │
│                         │  │  │ [⚠ Tier 2]  Jane Doe — Grade 8-A                  │   │  │
│                         │  │  │ Flagged: 4 absences + 2 overdue assignments       │   │  │
│                         │  │  │ [Review Flag →]                                   │   │  │
│                         │  │  └───────────────────────────────────────────────────┘   │  │
│                         │  │  ... (1 more visible; [View All 4 Flags] link)          │  │
│                         │  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┴────────────────────────────────────────────────────────────────┘
```

### Mobile Wireframe (< 640px)

```
┌─── Global Header (64px) ──────────────────────────────────────────┐
│ [≡ Menu]  Apex High School        🔔(2)      [⎋]                │
└───────────────────────────────────────────────────────────────────┘
┌─── Scrollable Content ────────────────────────────────────────────┐
│                                                                   │
│ [B1] ⚠ 2 unsubmitted attendance rosters — sticky top          │
│       [Go to 8-A →]  [Go to 9-B →]                              │
│                                                                   │
│ <h1>Educator Overview</h1>                                        │
│                                                                   │
│ [B2] Metric cards — 2×2 grid                                     │
│ ┌────────────────┬────────────────┐                               │
│ │  Today's       │  Pending       │                               │
│ │  Classes: 6    │  Grading: 14   │                               │
│ ├────────────────┼────────────────┤                               │
│ │  Support       │  At Risk       │                               │
│ │  Flags: 4 ⚠   │  Students: 3 🔴│                               │
│ └────────────────┴────────────────┘                               │
│                                                                   │
│ [B3] <h2>Today's Classes</h2>                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ 08:00 — Grade 8 Math (Section 8-A, Room 201)                 │ │
│ │ [📋 Take Attendance]  ← primary button, full-width, 48px      │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ 10:00 — Grade 9 Science (Section 9-B, Room 115)              │ │
│ │ [📋 Take Attendance]                                          │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [B5] <h2>Pending Flags (4)</h2>                                   │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [⚠ Tier 2]  Jane Doe — 8-A                                   │ │
│ │ 4 absences + 2 overdue assignments                            │ │
│ │ [Review Flag →]  48px target                                  │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
┌─── Bottom Navigation (56px) ──────────────────────────────────────┐
│   🏠 Home  │  📋 Attend  │  📝 Grading  │  🏳 Support (4)      │
└───────────────────────────────────────────────────────────────────┘
```

---

## WF-TCH-02 — Morning Attendance Grid

**Route**: `/teacher/classes/:sectionId/attendance` | **Figma Frame**: `Teacher / Attendance`

### Desktop Wireframe (≥ 1024px)

```
┌─── [Sidebar] ───────────────┬─── Main Canvas ──────────────────────────────────────────┐
│                             │                                                           │
│                             │  <nav>Breadcrumb: Home / Classes / Section 8-A / Attendance│
│                             │                                                           │
│                             │  <h1>Morning Attendance — Section 8-A</h1>               │
│                             │  Mathematics  |  Fri, Nov 5, 2026   [< Date Prev] [Date Next >]│
│                             │                                                           │
│                             │  ┌── [C1] Action Toolbar ──────────────────────────────┐  │
│                             │  │ [✓ Mark All Present]  [Filter: All ▾]  [🔍 Search] │  │
│                             │  │ 30 students  |  28 Marked  |  2 Unmarked            │  │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [C2] Offline Alert (shown when offline) ──────────┐  │
│                             │  │ ⚡ Offline — Changes queued locally (2). [Sync when  │  │
│                             │  │ reconnected]                                          │  │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  <table aria-label="Attendance roster — Section 8-A">    │
│                             │  ┌───┬──────┬────────────┬────────────────┬──────┬──────┐│
│                             │  │[□]│Photo │Student Name│ P / A / L / E  │Rate  │Rmk   ││
│                             │  ├───┼──────┼────────────┼────────────────┼──────┼──────┤│
│                             │  │[□]│[Avt] │Jane Doe    │[P●][A ][L ][E ]│94%✓  │[+]  ││
│                             │  │[□]│[Avt] │John Smith  │[P ][A●][L ][E ]│72%⚠  │Note ││
│                             │  │[□]│[Avt] │Ana Patel   │[P ][A ][L ][E ]│──%  –│[+]  ││
│                             │  │   │      │(UNMARKED)  │                │      │      ││
│                             │  └───┴──────┴────────────┴────────────────┴──────┴──────┘│
│                             │  ... (virtual scroll for >50 students)                   │
│                             │                                                           │
│                             │  ┌── [C3] Sticky Submit Bar (bottom) ─────────────────┐  │
│                             │  │ 28 Present  |  2 Absent  |  0 Late  |  0 Excused   │  │
│                             │  │ [2 Unmarked — resolve before submitting]            │  │
│                             │  │ [Submit Roster (30)]  ← Primary, 48px height        │  │
│                             │  └────────────────────────────────────────────────────┘  │
└─────────────────────────────┴────────────────────────────────────────────────────────────┘
```

### Mobile Wireframe (< 640px)

```
┌─── Header ─────────────────────────────────────────────────────────┐
│ [←] Attendance — 8-A     Nov 5, 2026                   [Filter ▾] │
└────────────────────────────────────────────────────────────────────┘
┌─── Sticky Action Bar ──────────────────────────────────────────────┐
│ 28 Marked  |  2 Unmarked     [✓ Mark All Present]                │
└────────────────────────────────────────────────────────────────────┘
┌─── Scrollable Student Card Stack ──────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ [Avatar 40px]  Jane Doe             STU-0012                 │  │
│ │                Attendance: 94% ✓                             │  │
│ │  ┌──────────┬──────────┬──────────┬──────────┐              │  │
│ │  │[✓PRESENT]│  ABSENT  │   LATE   │  EXCUSED  │             │  │
│ │  │ 48px h   │ 48px h   │ 48px h   │ 48px h    │             │  │
│ │  └──────────┴──────────┴──────────┴──────────┘              │  │
│ │  [+ Add remark]  ← ghost button, 44px min                   │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                        12px gap                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ [Avatar 40px]  Ana Patel              STU-0014               │  │
│ │                Attendance: – (not yet marked) ⚠             │  │
│ │  ┌──────────┬──────────┬──────────┬──────────┐              │  │
│ │  │ PRESENT  │  ABSENT  │   LATE   │  EXCUSED  │             │  │
│ │  │ (none    │ selected)│          │           │             │  │
│ │  └──────────┴──────────┴──────────┴──────────┘              │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
┌─── Sticky Submit Dock (above bottom nav) ──────────────────────────┐
│  28 Present • 2 Absent • 0 Late                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Submit Roster (30)              h: 52px             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
┌─── Bottom Nav (56px) ──────────────────────────────────────────────┐
│  🏠 Home  |  📋 Attend● |  📝 Grading  |  🏳 Support            │
└────────────────────────────────────────────────────────────────────┘
```

### Annotations

| ID     | Element          | Specification                                                                                       |
| :----- | :--------------- | :-------------------------------------------------------------------------------------------------- |
| C1     | Action Toolbar   | Mark All Present = secondary button; Filter = select dropdown; count badge live-updates             |
| C2     | Offline Banner   | `role="status"`, amber, dismissible, shows queued count                                             |
| C3     | Submit Bar       | Sticky `position: sticky; bottom: 0`; disabled until ≥1 change; `aria-busy` on submit               |
| C-Date | Date Picker      | Defaults to current school date (server timezone); previous dates = edit mode (audit note required) |
| C-Chip | Attendance Chips | PRESENT pre-selected by default on page load (optimistic); `aria-pressed` reflects state            |
| C-Rate | Rate Column      | Color-coded: ≥85% = success, 75–84% = warning, <75% = danger; text + color (SC 1.4.1)               |

---

## WF-TCH-03 — Submission Grading Queue

**Route**: `/teacher/assignments/:assignmentId/grading` | **Figma Frame**: `Teacher / Grading Queue`

```
┌─── [Sidebar] ───────────────┬─── Main Canvas ──────────────────────────────────────────┐
│                             │  Breadcrumb: Home / Grade 8 Math / Fractions P.S. 3 / Grading│
│                             │                                                           │
│                             │  <h1>Grading Queue — Fractions Problem Set 3</h1>         │
│                             │  Due: Nov 3, 2026  |  Max Score: 50 pts  |  32 submissions│
│                             │                                                           │
│                             │  ┌── [D1] Filter Bar ──────────────────────────────────┐  │
│                             │  │ [Status: All ▾] [Submitted ▾] [Sort: Name A-Z ▾]    │  │
│                             │  │ Active: [Status: Submitted ✕]      Showing 18 of 32  │  │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [D2] Stats Row ─────────────────────────────────┐   │
│                             │  │  Submitted: 18  |  Graded: 10  |  Missing: 6  |   │   │
│                             │  │  Late: 4  |  Avg Score: 36/50                     │   │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  <table aria-label="Submission grading queue">            │
│                             │  ┌─────┬──────────────┬──────────┬──────────┬──────────┐ │
│                             │  │ [□] │ Student Name │ Submitted│ Status   │ Score    │ │
│                             │  ├─────┼──────────────┼──────────┼──────────┼──────────┤ │
│                             │  │ [□] │ Jane Doe     │ Nov 2    │[Submitted]│[Grade →]│ │
│                             │  │ [□] │ John Smith   │ Nov 3 🕐 │ [Late]   │ 42/50 ✓ │ │
│                             │  │ [□] │ Ana Patel    │ —        │ [Missing]│   —     │ │
│                             │  └─────┴──────────────┴──────────┴──────────┴──────────┘ │
│                             │                                                           │
│                             │  ┌── [D3] Batch Action Bar ──────────────────────────┐   │
│                             │  │ 3 selected  [Release Grades (3)] [Mark Missing (3)]│   │
│                             │  └────────────────────────────────────────────────────┘  │
└─────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## WF-TCH-04 — Grading Drawer (Split View)

**Route**: `?drawer=:submissionId` | **Figma Frame**: `Teacher / Grading Drawer`

```
┌─── Grading Queue Table (truncated, inert) ─┬─── Grading Drawer (480px) ──────────────────┐
│                                            │                                             │
│  ... table rows (aria-hidden="true") ...  │  [←] [Grading: Jane Doe]              [✕] │
│  → Jane Doe row [ACTIVE, highlighted]     │  3 of 18 submitted   [← Prev]  [Next →]    │
│                                            │  ─────────────────────────────────────────│
│                                            │                                             │
│                                            │  <h2>Submission — Jane Doe (STU-0012)</h2>  │
│                                            │  Submitted: Nov 2, 2026 at 09:14          │
│                                            │  [⬇ Download Attachment (PDF, 1.4MB)]      │
│                                            │                                             │
│                                            │  ┌── [E1] Submission Preview ─────────────┐ │
│                                            │  │ [Scrollable document preview frame]   │ │
│                                            │  │ or submission text content            │ │
│                                            │  │ (height: 240px, overflow: scroll)     │ │
│                                            │  └────────────────────────────────────────┘ │
│                                            │                                             │
│                                            │  [Label] Score (out of 50) *               │
│                                            │  ┌──────────────────────────────────────┐  │
│                                            │  │  42                       / 50 pts   │  │
│                                            │  └──────────────────────────────────────┘  │
│                                            │  ⓘ Rubric: 10pt structure, 40pt content   │
│                                            │                                             │
│                                            │  [Label] Constructive Feedback *           │
│                                            │  ┌──────────────────────────────────────┐  │
│                                            │  │ Excellent use of equivalent fractions│  │
│                                            │  │ in question 3. For question 5, try   │  │
│                                            │  │ using the cross-multiplication method│  │
│                                            │  │ to verify your answer.               │  │
│                                            │  └──────────────────────────────────────┘  │
│                                            │  (min height: 120px, `aria-required`)      │
│                                            │                                             │
│                                            │  ─────────────────────────────────────────│
│                                            │  [Save Grade & Feedback]  Cmd+Enter      │
│                                            │  (Primary button, full-width, 48px)       │
└────────────────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## WF-TCH-05 — Support Flags Triage Queue

**Route**: `/teacher/support/queue` | **Figma Frame**: `Teacher / Support Queue`

```
┌─── [Sidebar] ───────────────┬─── Main Canvas ──────────────────────────────────────────┐
│                             │  <h1>Student Support — Early Warning Queue</h1>           │
│                             │  4 flags awaiting your review                             │
│                             │                                                           │
│                             │  [Filter: Tier All ▾] [Category: All ▾] [Section: All ▾] │
│                             │                                                           │
│                             │  ┌── [F1] Tier 2 Flag Card ──────────────────────────┐   │
│                             │  │  [⚠ Tier 2 — Moderate Risk]      Section 8-A      │   │
│                             │  │                                                    │   │
│                             │  │  Jane Doe — STU-0012                               │   │
│                             │  │  Flagged: Nov 5, 2026                             │   │
│                             │  │                                                    │   │
│                             │  │  📋 Why flagged (transparent evidence):            │   │
│                             │  │  • 4 unexcused absences in the last 14 days (↑)   │   │
│                             │  │  • 2 overdue assignments (Mathematics)            │   │
│                             │  │  • Attendance rate dropped: 94% → 72%             │   │
│                             │  │                                                    │   │
│                             │  │  [View Student Profile →]                         │   │
│                             │  │                                                    │   │
│                             │  │  ─────────────────────────────────────────────── │   │
│                             │  │  [Dismiss with Note]       [Confirm & Draft Plan] │   │
│                             │  │   Secondary, danger ghost    Primary, 48px height │   │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [F2] Tier 1 Flag Card ──────────────────────────┐   │
│                             │  │  [⚡ Tier 1 — Early Watch]      Section 9-B       │   │
│                             │  │  Michael Chen — STU-0019                          │   │
│                             │  │  • 3 absences in 10 days                          │   │
│                             │  │  • 1 overdue assignment (Science)                 │   │
│                             │  │  [Dismiss with Note]       [Confirm & Draft Plan] │   │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ... 2 more flag cards                                   │
└─────────────────────────────┴────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Non-Punitive Design Principle**: Flag cards use **amber** (Tier 1), **orange** (Tier 2), and **red** (Tier 3) accent colors — never stigmatizing language. The evidence section shows factual, objective data only. No "at-risk label" is permanently attached to the student record until a human educator confirms the flag. This satisfies the Human-in-the-Loop governance mandate from AGENTS.md Rule 13.

---

## WF-TCH-06 — Student Longitudinal Profile

**Route**: `/teacher/students/:studentId` | **Figma Frame**: `Teacher / Student Profile`

```
┌─── [Sidebar] ───────────────┬─── Main Canvas ──────────────────────────────────────────┐
│                             │  Breadcrumb: Home / Classes / Section 8-A / Jane Doe     │
│                             │                                                           │
│                             │  ┌── [G1] Student Identity Header ───────────────────┐   │
│                             │  │ [Avatar 64px]  Jane Doe                           │   │
│                             │  │                STU-0012  •  Grade 8  •  Section 8-A│   │
│                             │  │                Enrolled: Sep 1, 2026               │   │
│                             │  │  [Initiate Support Flag ▶]  [Log Pastoral Note ▶] │   │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [G2] Key Metrics Row (3 cards) ─────────────────┐   │
│                             │  │  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │   │
│                             │  │  │ Attendance   │ │ Avg Grade    │ │ Support   │ │   │
│                             │  │  │    72%  ⚠   │ │   76%        │ │  1 Active │ │   │
│                             │  │  │ [badge-warn] │ │ [badge-neut] │ │ [badge-inf│ │   │
│                             │  │  └──────────────┘ └──────────────┘ └───────────┘ │   │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [G3] Tab Navigation ─────────────────────────────┐  │
│                             │  │ [Attendance History] [Coursework & Grades] [Support]│  │
│                             │  │  ● active tab                                       │  │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [G4] Attendance History Tab Panel ───────────────┐  │
│                             │  │  Monthly Calendar Heat Map:                        │  │
│                             │  │  Oct 2026: 🟩🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩🟥🟥🟩🟩🟩  │  │
│                             │  │  (Green=Present, Red=Absent, Amber=Late)           │  │
│                             │  │  Accessible data table fallback below chart        │  │
│                             │  │                                                    │  │
│                             │  │  Consecutive absence alert:                        │  │
│                             │  │  ⚠ 3 consecutive absences: Nov 1–3, 2026         │  │
│                             │  └────────────────────────────────────────────────────┘  │
└─────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## WF-TCH-07 — Support Plan Creator Wizard

**Route**: `/teacher/support/plans/new` | **Figma Frame**: `Teacher / Plan Wizard`

```
┌─── [Sidebar] ───────────────┬─── Main Canvas ──────────────────────────────────────────┐
│                             │  <h1>Draft Support Plan — Jane Doe</h1>                  │
│                             │                                                           │
│                             │  ┌── [H1] Progress Stepper ──────────────────────────┐   │
│                             │  │  [1 Student ●]──[2 Goals]──[3 Actions]──[4 Review]│   │
│                             │  │  aria-current="step" on active step               │   │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── [H2] Step 1: Student & Context ──────────────────┐  │
│                             │  │                                                    │  │
│                             │  │  Student: Jane Doe (STU-0012) — pre-filled        │  │
│                             │  │  Trigger Flag: FL-082 (Attendance + Academic)     │  │
│                             │  │                                                    │  │
│                             │  │  [Label] Lead Educator *                          │  │
│                             │  │  [Select: Ms. Adams (you) ▾]                     │  │
│                             │  │                                                    │  │
│                             │  │  [Label] Support Tier *                           │  │
│                             │  │  ○ Tier 1 — Classroom monitoring                 │  │
│                             │  │  ● Tier 2 — Structured intervention              │  │
│                             │  │  ○ Tier 3 — External referral required           │  │
│                             │  │                                                    │  │
│                             │  │  [Label] Review Date (required) *                │  │
│                             │  │  [Date Picker: Nov 19, 2026]                     │  │
│                             │  │  ⓘ SMART guideline: 2–4 weeks from today        │  │
│                             │  │                                                    │  │
│                             │  └────────────────────────────────────────────────────┘  │
│                             │                                                           │
│                             │  ┌── Wizard Footer ──────────────────────────────────┐   │
│                             │  │  [Cancel — ghost]              [Next: Goals →]    │   │
│                             │  └────────────────────────────────────────────────────┘  │
└─────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## WF-ADM-01 — School Admin Dashboard

**Route**: `/school/dashboard` | **Figma Frame**: `Admin / Dashboard`

```
┌─── [Sidebar — SchoolAdminLayout] ───┬─── Main Canvas ─────────────────────────────────┐
│ [🏠] Dashboard ● active             │  <h1>Institutional Overview</h1>                │
│ [📚] Classes & Sections   [+2]      │  Apex High School  |  Term 1, 2026-27           │
│ [👥] Staff Directory                │                                                  │
│ [🎓] Student Directory              │  ┌── [I1] Alert Banners ───────────────────────┐  │
│ [📅] Academic Years                 │  │ ⚠ 3 sections have no attendance submitted   │  │
│ [📊] Pastoral Analytics             │  │ today. [View Sections →]                    │  │
│ [🔒] Audit Log                      │  └────────────────────────────────────────────┘  │
│ [⚙] School Settings                │                                                  │
│                                     │  ┌── [I2] Institution Metric Cards (6-grid) ──┐  │
│ [⎋ Sign Out]                        │  │  [Students: 847]  [Staff: 42]  [Active     │  │
│                                     │  │  [Attendance: 91%][Flags: 7]   [Support: 3]│  │
│                                     │  └────────────────────────────────────────────┘  │
│                                     │                                                  │
│                                     │  ┌── [I3] Attendance Overview ─────────────────┐  │
│                                     │  │  <h2>Today's Attendance by Section</h2>     │  │
│                                     │  │  [Section 8-A]  28/30  93%  [🟢 Submitted]  │  │
│                                     │  │  [Section 8-B]  —/30   —    [🔴 Missing]    │  │
│                                     │  │  [Section 9-A]  31/32  97%  [🟢 Submitted]  │  │
│                                     │  └────────────────────────────────────────────┘  │
└─────────────────────────────────────┴──────────────────────────────────────────────────┘
```

---

## WF-STU-01 — Student Dashboard

**Route**: `/student/dashboard` | **Figma Frame**: `Student / Dashboard`

```
┌─── Global Header ───────────────────────────────────────────────────┐
│ [≡]  [School Logo] Apex High School        🔔     [⎋ Sign Out]    │
└─────────────────────────────────────────────────────────────────────┘
┌─── Scrollable Content ──────────────────────────────────────────────┐
│                                                                     │
│  <h1>Good morning, Jane! 👋</h1>                                   │
│  Friday, November 5, 2026                                           │
│                                                                     │
│  ┌── [J1] Upcoming Class Alert ─────────────────────────────────┐  │
│  │ 🔔 Next class in 25 minutes                                  │  │
│  │ Grade 8 Mathematics  |  Room 201  |  Ms. Adams               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌── [J2] Today's Schedule ──────────────────────────────────────┐  │
│  │  <h2>Today's Classes</h2>                                    │  │
│  │  08:00  Mathematics — 8-A  Room 201                          │  │
│  │  10:00  Science — 8-A  Room 115                              │  │
│  │  13:00  English — 8-A  Room 302                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌── [J3] Due This Week ─────────────────────────────────────────┐  │
│  │  <h2>Due This Week</h2>                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ [📝] Fractions Problem Set 3    DUE: Nov 7             │  │
│  │  │      Mathematics  •  Pending submission                │  │
│  │  │      [Submit Now →]  48px height primary button        │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ [📝] Lab Report — Photosynthesis    DUE: Nov 8        │  │
│  │  │      Science  •  Pending submission                   │  │
│  │  │      [Submit Now →]                                   │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌── [J4] Recent Feedback ──────────────────────────────────────┐  │
│  │  <h2>Recent Teacher Feedback</h2>                           │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 📊 Geometry Quiz  |  42/50  |  Ms. Adams              │  │
│  │  │ "Excellent work on equivalent fractions!"              │  │
│  │  │ [View Feedback →]                                      │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
┌─── Bottom Navigation ───────────────────────────────────────────────┐
│   🏠 Home● │  📚 Subjects  │  📝 Tasks (2) │  📈 My Growth        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WF-STU-03 — Submit Assignment

**Route**: `/student/assignments/:id/submit` | **Figma Frame**: `Student / Submit`

```
┌─── Header ──────────────────────────────────────────────────────────┐
│ [←]  Submit Work — Fractions Problem Set 3            [⎋ Sign Out] │
└─────────────────────────────────────────────────────────────────────┘
┌─── Content ─────────────────────────────────────────────────────────┐
│                                                                     │
│  <h1>Fractions Problem Set 3</h1>                                   │
│  Mathematics  •  Due: Nov 7, 2026 at 23:59                         │
│  Max Score: 50 pts                                                  │
│                                                                     │
│  ┌── [K1] Assignment Instructions (collapsible) ────────────────┐  │
│  │  [▼ View Assignment Instructions]                            │  │
│  │  Complete problems 1–10 in Chapter 6. Show all working.     │  │
│  │  Upload a scanned PDF or image of your work.                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Label] Your Written Response (optional)                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │  Type your answer here...                                     │ │
│  │                                                                │ │
│  │  (min-height: 160px, resizable)                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [Label] Upload Your Work (optional)                                │
│  ┌── [K2] File Upload Dropzone ──────────────────────────────────┐  │
│  │                  ⬆                                           │  │
│  │        Drag & drop files here, or                            │  │
│  │        [Browse Files]  ← accessible button                   │  │
│  │                                                              │  │
│  │  Accepted: PDF, JPG, PNG  •  Max size: 10 MB per file       │  │
│  │                                                              │  │
│  │  [✓ fractions_work.pdf  1.2 MB  [✕ Remove]]                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ⓘ Submissions cannot be edited after the deadline.               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
┌─── Sticky Submit Dock ──────────────────────────────────────────────┐
│  [Save Draft]                            [Submit Work  →]          │
│   Secondary                              Primary, 52px height       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WF-STU-04 — My Progress & Growth

**Route**: `/student/progress` | **Figma Frame**: `Student / Progress`

```
┌─── Content ─────────────────────────────────────────────────────────┐
│                                                                     │
│  <h1>My Progress & Growth</h1>                                      │
│  Term 1, 2026-27  |  Apex High School                              │
│                                                                     │
│  ┌── [L1] Attendance Summary ────────────────────────────────────┐  │
│  │  <h2>Attendance</h2>                                         │  │
│  │  ┌──────────────────────────────────────────┐                │  │
│  │  │  [Circular Progress: 72%]                │                │  │
│  │  │  72% Attendance Rate                     │                │  │
│  │  │  [⚠ Below target — 85% recommended]     │                │  │
│  │  │  Absences: 6  |  Late: 2               │                │  │
│  │  └──────────────────────────────────────────┘                │  │
│  │  Accessible data table: [Date | Status | Subject]            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌── [L2] Subject Progress Cards ────────────────────────────────┐  │
│  │  <h2>Academic Progress by Subject</h2>                       │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │ 📐 Mathematics (Ms. Adams)                           │    │  │
│  │  │ Average Grade: 76%  •  [badge-warning "On Watch"]   │    │  │
│  │  │ ████████████░░░░░░  76/100                          │    │  │
│  │  │ Latest: Fractions P.S.3 — Pending grade             │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │ 🔬 Science (Mr. Kumar)                               │    │  │
│  │  │ Average Grade: 88%  •  [badge-success "On Track"]   │    │  │
│  │  │ ████████████████░░  88/100                          │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌── [L3] Active Support Goals (shown if plan exists) ───────────┐  │
│  │  <h2>Your Support Goals 💪</h2>                              │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │ Goal 1: Attend at least 90% of Mathematics classes  │    │  │
│  │  │ Progress: 72% → target 90%                          │    │  │
│  │  │ ████████░░░░░░░░  72/90                             │    │  │
│  │  │ Check-in with Ms. Adams every Tuesday               │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> The student-facing progress view is designed around **encouraging, non-punitive language** (8th-grade reading level). Progress bars are always framed as "how far you've come" rather than "how much you've failed." Support goals use motivational framing. See `product-overview.md` Section 3 — Human Dignity principle.
