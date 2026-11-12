# Interactive Prototype Specification — FSD-SDG-4 Quality Education SaaS

**Phase**: `PHASE 3: UI/UX Design System, Wireframes & Clickable Prototype`  
**Status**: Authoritative Prototype Interaction & Flow Specification  
**Standard**: WCAG 2.2 Level AA — Zero Keyboard Traps  
**Last Reviewed**: 2026-11-05

> [!IMPORTANT]
> **Figma Plugin Status**: The Figma plugin (`antigravity-plugins-partners/plugin/figma`) is **not currently installed**. This document constitutes the complete, production-grade **interaction specification** for the clickable prototype. It defines every prototype connection, trigger, action, overlay, and animation that must be configured in Figma when the plugin is available.
>
> **To activate Figma integration**: Install the plugin from the marketplace using the card below and re-run this phase. The agent will then directly author the Figma file and prototype connections using the Figma MCP tools.

<plugin-card catalog-id="antigravity-plugins-partners/plugin/figma"></plugin-card>

> [!NOTE]
> Until Figma is available, this specification is **fully sufficient** for a designer to build the prototype manually. Every interaction, overlay behavior, transition, and prototype flow is documented with Figma-native terminology.

---

## 1. Prototype Architecture Overview

The prototype covers **3 complete user journey flows** demonstrating the core pedagogical loop:

| Journey       | Persona | Flow Name                  | Screens Covered                                          |
| :------------ | :------ | :------------------------- | :------------------------------------------------------- |
| **Journey 1** | Teacher | Morning Attendance Flow    | Sign In → Dashboard → Attendance Grid → Submit → Success |
| **Journey 2** | Teacher | Support Flag Triage Flow   | Dashboard → Flag Queue → Flag Review Modal → Plan Wizard |
| **Journey 3** | Student | Assignment Submission Flow | Student Dashboard → Assignments → Submit Work → Success  |

Additionally, **4 component overlay demonstrations** are prototyped:

- Grading Drawer open/close
- Offline sync banner interaction
- Session timeout warning modal
- Destructive confirmation (Type-to-Confirm)

---

## 2. Figma File Structure

When implementing in Figma, organize the file as follows:

```
FSD-SDG-4 Design System/
├── 📄 Cover Page
│   └── Project summary, design decisions, team, version
│
├── 🗂 Page: 🎨 Design Tokens
│   ├── Color Styles (all tokens from 01-design-tokens.md)
│   ├── Text Styles (all type tokens)
│   ├── Effect Styles (shadows, focus rings)
│   └── Layout Grid Styles
│
├── 🗂 Page: 🧱 Component Library
│   ├── Tier 1: Base Primitives
│   │   ├── Button (5 variants × 6 states × 3 sizes)
│   │   ├── Input Field (6 states)
│   │   ├── Badge/Chip (10 variants × 3 sizes)
│   │   ├── Attendance Chip Group (all 4 status options)
│   │   ├── Modal (1 variant × 3 sizes)
│   │   ├── Drawer (right-anchored)
│   │   ├── Toast (4 variants)
│   │   ├── Skeleton (all 9 element types)
│   │   └── Empty State (6 variants)
│   │
│   ├── Tier 2: Layout Components
│   │   ├── Global Header (desktop / tablet / mobile)
│   │   ├── Sidebar Navigation (expanded / compact)
│   │   ├── Bottom Navigation (teacher / student / admin variants)
│   │   ├── Breadcrumb (desktop / mobile collapsed)
│   │   └── Skip Link
│   │
│   └── Tier 3: Domain Components (documentation frames)
│       ├── Attendance Roster Table
│       ├── Support Flag Card
│       ├── Grading Drawer
│       └── Support Plan Wizard Stepper
│
├── 🗂 Page: 📱 Mobile Wireframes (390×844)
│   ├── WF-PUB-01 — Sign In (mobile)
│   ├── WF-TCH-01 — Teacher Dashboard (mobile)
│   ├── WF-TCH-02 — Morning Attendance (mobile)
│   ├── WF-TCH-05 — Support Queue (mobile)
│   ├── WF-STU-01 — Student Dashboard (mobile)
│   ├── WF-STU-02 — My Assignments (mobile)
│   ├── WF-STU-03 — Submit Work (mobile)
│   └── WF-STU-04 — My Progress (mobile)
│
├── 🗂 Page: 🖥 Desktop Wireframes (1440×900)
│   ├── WF-PUB-01 — Sign In (desktop)
│   ├── WF-TCH-01 — Teacher Dashboard (desktop)
│   ├── WF-TCH-02 — Morning Attendance (desktop)
│   ├── WF-TCH-03 — Grading Queue (desktop)
│   ├── WF-TCH-04 — Grading Drawer (overlay)
│   ├── WF-TCH-05 — Support Queue (desktop)
│   ├── WF-TCH-06 — Student Profile (desktop)
│   ├── WF-TCH-07 — Plan Wizard (desktop)
│   ├── WF-ADM-01 — Admin Dashboard (desktop)
│   ├── WF-ADM-02 — Student Directory (desktop)
│   └── WF-STU-01 — Student Dashboard (desktop)
│
├── 🗂 Page: 🔗 Prototype Journeys
│   ├── Journey 1: Morning Attendance Flow
│   ├── Journey 2: Support Flag Triage Flow
│   └── Journey 3: Student Assignment Submission
│
└── 🗂 Page: ♿ Accessibility Annotations
    ├── Focus Order Diagrams
    ├── ARIA Role Maps
    └── Color Contrast Audit Board
```

---

## 3. Prototype Connection Map — Journey 1: Morning Attendance

**Persona**: Teacher (Ms. Adams) | **Devices**: Mobile (390px) + Desktop (1440px)  
**Goal**: Complete morning attendance for Section 8-A in ≤ 90 seconds  
**Success Metric**: Flow verified at 42 seconds in Phase 2 task analysis

### 3.1 Mobile Prototype Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                      JOURNEY 1 — MORNING ATTENDANCE (MOBILE)                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

[Frame: WF-PUB-01 Mobile — Sign In]
  │
  │ Trigger: Click "Sign In" button
  │ Action: Navigate to → WF-TCH-01 Mobile — Teacher Dashboard
  │ Transition: Dissolve, 300ms ease-out
  │
  ▼
[Frame: WF-TCH-01 Mobile — Teacher Dashboard]
  │
  │ Trigger: Click "Take Attendance" button on "Grade 8 Mathematics" class card
  │ Action: Navigate to → WF-TCH-02 Mobile — Morning Attendance
  │ Transition: Push left, 300ms ease-out
  │
  ▼
[Frame: WF-TCH-02 Mobile — Attendance (All Unmarked state)]
  │
  │ Trigger: Click "✓ Mark All Present" button
  │ Action: Overlay → [Overlay: Mark All Present Confirmation]
  │         Type: Modal, centered, background: darken
  │
  │   [Overlay: Mark All Present Confirmation]
  │   "Mark all 30 students as Present for today?"
  │   [Cancel] ──→ Dismiss overlay
  │   [Mark All Present] ──→ Dismiss overlay + Update frame state
  │
  │ Action (after confirm): Smart Animate to → WF-TCH-02 Mobile — Attendance (All Present state)
  │ Transition: Smart Animate, 200ms ease
  │
  ▼
[Frame: WF-TCH-02 Mobile — Attendance (All Present state)]
  │
  │ Trigger: Click "Submit Roster (30)" sticky button
  │ Action: Navigate to → WF-TCH-02-Submit Mobile — Attendance Submitting
  │ Transition: Smart Animate (spinner appears on button)
  │
  ▼
[Frame: WF-TCH-02-Submit Mobile — Attendance Submitting]
  │ (Button shows spinner + "Submitting..." text, 1500ms delay simulation)
  │
  │ Trigger: After delay (1500ms)
  │ Action: Navigate to → WF-TCH-01 Mobile — Teacher Dashboard (Post-Submit state)
  │ Transition: Dissolve
  │
  ▼
[Frame: WF-TCH-01 Mobile — Teacher Dashboard (Post-Submit state)]
  │
  │ Shows: Toast notification — "✓ Attendance recorded: 30 Present, 0 Absent"
  │        Priority Alert Banner is now hidden (attendance submitted)
  │        Section 8-A card shows "🟢 Submitted" badge
  │
  └── [End of Journey 1 — Prototype flow complete]
```

### 3.2 Desktop Prototype Flow

The desktop prototype mirrors the mobile flow but demonstrates the sidebar navigation and larger table layout. Key differences:

- Dashboard shows the sidebar expanded at 240px
- Attendance view shows the full data table (not mobile cards)
- Submit bar is a horizontal row at bottom of table, not full-width dock

---

## 4. Prototype Connection Map — Journey 2: Support Flag Triage

**Persona**: Teacher | **Device**: Desktop (1440px)  
**Goal**: Review and act on an early warning flag in ≤ 60 seconds

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                       JOURNEY 2 — SUPPORT FLAG TRIAGE (DESKTOP)                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

[Frame: WF-TCH-01 Desktop — Teacher Dashboard]
  │
  │ Trigger: Click alert badge "4" on sidebar "Support Plans" nav item
  │          OR Click "Review Flag →" on the Dashboard flag summary card
  │ Action: Navigate to → WF-TCH-05 Desktop — Support Flags Queue
  │ Transition: Push left, 300ms
  │
  ▼
[Frame: WF-TCH-05 Desktop — Support Queue]
  │
  │ Trigger: Click "Confirm & Draft Plan" on the Jane Doe Tier 2 flag card
  │ Action: Overlay → [Overlay: Flag Review Modal]
  │         Type: Modal, 480px width, centered, background: darken + blur
  │
  │   ┌── [Overlay: Flag Review Modal] ──────────────────────────────────────────────┐
  │   │                                                                              │
  │   │  [✕ close button — top right]                                               │
  │   │                                                                              │
  │   │  <h2>Review Early Warning Flag — Jane Doe</h2>                              │
  │   │  Flag ID: FL-082  |  Flagged: Nov 5, 2026                                  │
  │   │                                                                              │
  │   │  📋 Evidence Summary:                                                       │
  │   │  • 4 unexcused absences in the last 14 days                                │
  │   │  • 2 overdue Mathematics assignments                                        │
  │   │  • Attendance rate: 94% → 72% (↓22%)                                       │
  │   │                                                                              │
  │   │  [View Full Student Profile ↗]  (opens in new tab)                        │
  │   │                                                                              │
  │   │  [Label] Your Assessment (required):                                        │
  │   │  ○ Confirm — this flag is valid and warrants a Support Plan                │
  │   │  ○ Dismiss — provide justification below                                    │
  │   │                                                                              │
  │   │  [Conditional: shown when "Dismiss" selected]                              │
  │   │  [Label] Dismissal Justification *                                          │
  │   │  [Textarea: min 15 characters]                                              │
  │   │                                                                              │
  │   │  [Cancel]                     [Confirm: Draft Support Plan →]              │
  │   │  Secondary ghost               Primary, disabled until selection made      │
  │   └──────────────────────────────────────────────────────────────────────────────┘
  │
  │ Trigger: Click "Confirm: Draft Support Plan →" (after selecting "Confirm")
  │ Action: Dismiss modal + Navigate to → WF-TCH-07 Desktop — Plan Wizard (Step 1)
  │ Transition: Dissolve, 300ms
  │
  ▼
[Frame: WF-TCH-07 Desktop — Support Plan Wizard — Step 1 (Student & Context)]
  │
  │ Trigger: Click "Next: Goals →" button
  │ Action: Smart Animate to → WF-TCH-07 Desktop — Plan Wizard — Step 2 (SMART Goals)
  │
  ▼
[Frame: WF-TCH-07 Desktop — Plan Wizard — Step 2 (SMART Goals)]
  │ [Goal entry form — prototype shows pre-filled example]
  │
  │ Trigger: Click "Next: Actions →" button
  │ Action: Smart Animate to → Plan Wizard — Step 3 (Action Items)
  │
  ▼
[Frame: WF-TCH-07 Desktop — Plan Wizard — Step 3 (Action Items)]
  │
  │ Trigger: Click "Next: Review →" button
  │ Action: Smart Animate to → Plan Wizard — Step 4 (Review & Activate)
  │
  ▼
[Frame: WF-TCH-07 Desktop — Plan Wizard — Step 4 (Review)]
  │
  │ Trigger: Click "Activate Support Plan"
  │ Action: Navigate to → WF-TCH-05 Desktop — Support Queue (Post-triage, flag resolved)
  │ Transition: Dissolve + Toast overlay
  │
  ▼
[Frame: WF-TCH-05 Desktop — Support Queue (1 fewer flag)]
  │
  │ Shows: Toast "✓ Support Plan SP-042 activated — Jane Doe"
  │        Jane Doe flag card is no longer in the queue
  │        Queue count: 4 → 3
  │
  └── [End of Journey 2]
```

---

## 5. Prototype Connection Map — Journey 3: Student Assignment Submission

**Persona**: Student (Jane Doe) | **Device**: Mobile (390px)  
**Goal**: Submit assignment homework in ≤ 60 seconds

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                   JOURNEY 3 — STUDENT ASSIGNMENT SUBMISSION (MOBILE)                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

[Frame: WF-STU-01 Mobile — Student Dashboard]
  │
  │ Trigger: Click "Submit Now →" on "Fractions Problem Set 3" due-this-week card
  │ Action: Navigate to → WF-STU-03 Mobile — Submit Assignment
  │ Transition: Push left, 300ms
  │
  ▼
[Frame: WF-STU-03 Mobile — Submit Assignment (Empty form)]
  │
  │ Interaction 1 — View Instructions:
  │   Trigger: Click "▼ View Assignment Instructions" accordion toggle
  │   Action: Smart Animate — expand accordion, reveal instructions text
  │
  │ Interaction 2 — Attach File:
  │   Trigger: Click "Browse Files" button
  │   Action: Overlay → [Overlay: File Attached Simulation]
  │   Shows: "✓ fractions_work.pdf  1.2 MB  [✕ Remove]" in dropzone
  │
  │ Trigger: Click "Submit Work →" sticky button (after file attached)
  │ Action: Smart Animate → button shows spinner + "Submitting..."
  │         After 1500ms delay → Navigate to → WF-STU-03 — Success state
  │
  ▼
[Frame: WF-STU-03 Mobile — Submit Assignment (Success state)]
  │
  │ Shows:
  │   ✓ Large green checkmark illustration
  │   <h2>"Work submitted successfully!"</h2>
  │   "Submitted on time — Nov 5, 2026 at 09:47"
  │   "Your teacher will review and provide feedback soon."
  │   [View My Assignments →] button
  │   [Back to Dashboard] link
  │   Toast (auto-dismiss): "✓ Work submitted successfully! Submitted on time."
  │
  └── [End of Journey 3]
```

---

## 6. Component Overlay Demonstrations

These standalone prototype interactions showcase reusable component behaviors independent of full journeys:

### 6.1 Grading Drawer — Open/Close

```
Starting Frame: WF-TCH-03 Desktop — Grading Queue

Trigger: Click "Grade →" action on Jane Doe's submission row
Action:
  • Overlay → WF-TCH-04 — Grading Drawer
  • Animation: Slide in from right edge
  • Type: Overlay (not full-screen navigate — table remains partially visible)

Inside Drawer:
  Trigger: Click [✕] or press Escape
  Action: Close overlay, return focus to Jane Doe's table row

  Trigger: Click [Next →] button
  Action: Smart Animate → Drawer content changes to John Smith's submission
```

### 6.2 Session Timeout Warning Modal

```
Starting Frame: Any authenticated frame (shown from TCH-01 Teacher Dashboard)

Trigger: Hotspot / "Session Expiry" prototype trigger button (for demo purposes)
Action: Overlay → [Overlay: Session Timeout Modal]

[Overlay: Session Timeout Modal]
  Title: "Your session is about to expire"
  Body: "You will be automatically signed out in 5:00 minutes due to inactivity."
  Live countdown: 5:00 → 4:59 → (prototype shows 2 states, 5:00 and 1:00)
  [Sign Out Now] — Secondary danger ghost
  [Stay Signed In →] — Primary (restores session, dismisses modal)

Trigger: Click "Stay Signed In"
Action: Dismiss overlay + Toast "Session extended — you remain signed in."

Trigger: Click "Sign Out Now" / After countdown expires
Action: Navigate to → WF-PUB-01 — Sign In
Transition: Dissolve, 500ms (slower — signifies intentional action)
```

### 6.3 Destructive Type-to-Confirm (Academic Year Archive)

```
Starting Frame: WF-ADM-02 Desktop — Academic Years Manager

Trigger: Click "Archive Academic Year 2025-2026" button
Action: Overlay → [Overlay: Type-to-Confirm Danger Modal]

[Overlay: Type-to-Confirm Danger Modal]
  Header: "⚠ Danger: Archive Academic Year 2025-2026"
  Body: Explanation of consequences
  Confirmation Input: "Type ARCHIVE 2025-2026 to confirm"
  [Cancel] — Secondary (dismiss overlay)
  [Permanently Archive] — Primary Danger, DISABLED state

  Interaction:
    Trigger: Text input matches "ARCHIVE 2025-2026" (simulated with 2 prototype states)
    Action: Smart Animate → "Permanently Archive" button transitions to enabled state

  Trigger: Click enabled "Permanently Archive" button
  Action: Dismiss overlay + Navigate to updated frame (year archived)
```

### 6.4 Offline Sync Interaction

```
Starting Frame: WF-TCH-02 Mobile — Attendance (Offline State)

Shows: Amber offline banner "⚡ Offline — 2 Rosters Queued"

Trigger: Click offline banner / "Sync when reconnected" text
Action: Overlay → [Overlay: Offline Sync Drawer]

[Overlay: Offline Sync Drawer]
  Title: "Offline Queue Manager"
  Shows: 2 queued attendance rosters
  "Section 8-A — Nov 5, 2026 — 30 students"
  "Section 9-B — Nov 4, 2026 — 28 students"
  [Sync All Now] — Primary (simulates reconnection)

  Trigger: Click "Sync All Now"
  Action: Smart Animate → spinner + "Syncing..." → dismiss drawer
          + Toast "✓ All offline rosters successfully synchronized"
          + Offline banner disappears from header
```

---

## 7. Prototype Overlay Settings Reference

For every overlay/modal in Figma prototype settings:

| Overlay Type              | Position                                         | Background                |     Close on Click Outside     |  Escape Key  |
| :------------------------ | :----------------------------------------------- | :------------------------ | :----------------------------: | :----------: |
| Modal Dialog (standard)   | Center                                           | Darken (50% opacity)      |              Yes               |     Yes      |
| Destructive Confirm Modal | Center                                           | Darken (50% opacity)      | **No** (must explicit confirm) | Yes (cancel) |
| Session Timeout Modal     | Center                                           | Darken (70% opacity)      |  **No** (forced interaction)   |      No      |
| Off-Canvas Drawer (right) | Right-anchored                                   | None (partial bg visible) |              Yes               |     Yes      |
| Mobile Bottom Sheet       | Bottom                                           | Darken (50% opacity)      |              Yes               |     Yes      |
| Command Palette           | Center-top (y: 80px)                             | Blur + Darken (40%)       |              Yes               |     Yes      |
| Toast Notification        | Fixed (bottom-center mobile / top-right desktop) | None                      |               No               |      No      |

---

## 8. Transition & Animation Reference

For every Figma prototype connection:

| Transition ID                | Trigger Type            | Animation                | Duration | Easing      |
| :--------------------------- | :---------------------- | :----------------------- | :------- | :---------- |
| Page Navigate Forward        | On Click                | Push Left                | 300ms    | Ease Out    |
| Page Navigate Back           | On Click                | Push Right               | 300ms    | Ease Out    |
| Modal Open                   | On Click                | Dissolve + Smart Animate | 300ms    | Ease Out    |
| Modal Close                  | On Click / On Key Press | Dissolve                 | 200ms    | Ease In     |
| Drawer Slide In              | On Click                | Move In (Right)          | 300ms    | Ease Out    |
| Drawer Slide Out             | On Click / On Key Press | Move Out (Right)         | 250ms    | Ease In     |
| State Change (Smart Animate) | After Delay / On Click  | Smart Animate            | 200ms    | Ease In-Out |
| Toast Appear                 | Automatic               | Move In (Up)             | 200ms    | Ease Out    |
| Toast Dismiss                | After Delay (5000ms)    | Move Out (Down)          | 150ms    | Ease In     |
| Button Loading State         | On Click                | Smart Animate            | 150ms    | Ease In-Out |
| Auth Redirect                | After Delay (1500ms)    | Dissolve                 | 500ms    | Ease In-Out |

---

## 9. Prototype Validation Checklist

Before presenting the prototype for review, verify each item:

### 9.1 Keyboard Navigation (Zero Keyboard Trap Verification)

- [ ] **Journey 1**: Tab through Sign In form → Dashboard → Attendance grid → chips → submit without mouse
- [ ] **Journey 2**: Flag Queue → Modal open (Tab to first element) → Escape closes modal, focus returns
- [ ] **Journey 3**: Dashboard → Assignments → Submit form → file input keyboard accessible
- [ ] **Grading Drawer**: Escape closes drawer, focus returns to triggering table row
- [ ] **Command Palette**: Cmd+K opens → Arrow keys navigate results → Escape closes → focus restored
- [ ] **Bottom Navigation**: Tab through all 4 items; Enter activates; `aria-current` updates

### 9.2 Color & Contrast (Pre-Prototype Visual Verification)

- [ ] All attendance chip labels readable: PRESENT/ABSENT/LATE/EXCUSED on their colored backgrounds ≥ 4.5:1
- [ ] Alert banners (amber warning, red error) text readable against tinted backgrounds ≥ 4.5:1
- [ ] Focus rings (2px blue `#2563EB` with white offset) visible on all interactive elements
- [ ] No information conveyed by color alone — all colored states have text + icon

### 9.3 Functional Prototype Completeness

- [ ] All 3 journeys navigable end-to-end without dead links
- [ ] All 4 component overlay demonstrations functional
- [ ] Mobile (390px) and Desktop (1440px) variants both prototype-linked
- [ ] Empty states visible (attendance roster with no students, support queue empty)
- [ ] Loading/skeleton states visible (accessible via prototype branch or state variant)
- [ ] Error states visible (sign-in with wrong credentials, form validation errors)
- [ ] Session timeout modal reachable via prototype hotspot

---

## 10. Figma Share & Handoff Settings

When the Figma prototype is complete:

### 10.1 Share Settings

- **View access**: Anyone with link (for stakeholder review)
- **Edit access**: Frontend Lead + Product Lead only
- **Prototype link**: Share with "Show prototype" mode enabled

### 10.2 Handoff Notes for Developers (Phase 13)

- All design tokens must be mapped 1:1 to Tailwind CSS custom theme config
- Component specifications in `02-component-specifications.md` are the ARIA implementation contracts
- Figma Dev Mode: Mark all production-ready frames with "Ready for Development" status badge
- Annotate every component's CSS token name in Figma notes
- Export spacing values as CSS custom properties matching token names in `01-design-tokens.md`
