# User Flow Inventory and Interaction Journeys

This document details the interaction sequences, screen transitions, validation branches, and edge-case handling for the core user flows of the **FSD-SDG-4 Quality Education SaaS** platform.

---

## Flow UF-01: Morning Attendance Roster Entry & Amendment

```mermaid
flowchart TD
    Start([Teacher Opens App]) --> Dash[Teacher Dashboard: Pending Attendance Card]
    Dash -->|Clicks 'Take Attendance'| Grid[Roster Grid Loads: All Default to PRESENT]
    Grid --> Toggle[Teacher Toggles Absent / Late Students]
    Toggle -->|Clicks 'Submit Roster'| Valid{Are all students accounted for?}
    Valid -- No --> Err[Validation Highlight on missing rows]
    Valid -- Yes --> Mutate[Optimistic UI Update + POST /api/v1/attendance]
    Mutate -->|Success| Confirm[Success Toast + Dashboard Card Updates to 'Submitted']
    Mutate -->|Network Error| Retry[Offline Warning Banner + Retry Button]
```

- **Happy Path**: Teacher selects section $\to$ all 32 students default to `PRESENT` $\to$ teacher clicks student #4 to `ABSENT` $\to$ clicks student #12 to `LATE` $\to$ clicks *"Submit Roster"* $\to$ persistent state confirmed within $\le 90$ seconds.
- **Edge Case (Late Modification)**: Teacher amends an attendance record later in the day: opens *Attendance History Ledger* $\to$ updates student #4 from `ABSENT` to `EXCUSED` with reason note $\to$ change is saved and logged in the immutable audit table.

---

## Flow UF-02: Assignment Creation, Distribution & Digital Grading

1. **Authoring**: Teacher clicks *"New Assignment"* inside a Course Offering $\to$ inputs title, markdown instructions, max points ($50$), due date $\to$ attaches reference PDF.
2. **Distribution**: Teacher clicks *"Publish"* $\to$ assignment is immediately visible on student portals.
3. **Student Submission**: Student navigates to *Assignments* $\to$ clicks *"Submit Work"* $\to$ enters text or uploads file $\to$ clicks *"Confirm"*. System checks submission time against deadline and stamps status (`SUBMITTED` or `LATE`).
4. **Grading & Constructive Feedback**: Teacher opens *Grading Queue* $\to$ reviews student response in drawer $\to$ enters score ($42/50$) $\to$ inputs structured qualitative feedback $\to$ clicks *"Publish Grade"*. Student dashboard reflects updated grade and feedback card.

---

## Flow UF-03: The Closed Support Loop ($\text{Flag} \to \text{Plan} \to \text{Review}$)

```mermaid
flowchart TD
    Trigger([System Detects: Attendance < 75% or 3 Missing Tasks]) --> GenFlag[System Creates PROPOSED Support Flag]
    GenFlag --> Badge[Teacher Dashboard Shows Amber Alert Badge]
    Badge --> Triage[Teacher Opens Flag Review Modal]
    Triage --> Decision{Educator Human Decision}
    Decision -- Dismiss --> DismissModal[Mandatory Reason Input -> Flag Marked DISMISSED]
    Decision -- Confirm --> PlanWizard[Draft Support Plan Wizard]
    PlanWizard --> SavePlan[Set SMART Goals & Assign Action Items -> Status: ACTIVE]
    SavePlan --> Milestones[Milestone Tracker: Review Date Reached]
    Milestones --> Review[Teacher Records Outcome: RESOLVED / CONTINUED / ESCALATED]
```

- **Step 1: Transparent Early Warning**: System triggers a `PROPOSED` flag based on objective thresholds (e.g. 4 unexcused absences).
- **Step 2: Human Review Gate**: Teacher reviews the evidence. If the absence was pre-excused, teacher dismisses the flag with a note. If valid, teacher confirms the flag.
- **Step 3: Actionable Support Plan**: Teacher defines SMART goals and action items (e.g., peer tutor, guardian call).
- **Step 4: Milestone Evaluation**: On the review date, educator evaluates progress. If goals are met, the plan is marked `RESOLVED`. If gaps persist, the plan is updated or escalated.
