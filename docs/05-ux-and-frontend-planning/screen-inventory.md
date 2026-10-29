# Screen Inventory and Component State Catalog

This document catalogues the complete inventory of screens, view types, modals, drawers, and system states across all roles for the **FSD-SDG-4 Quality Education SaaS** frontend. In accordance with platform priorities, **Teacher screens are inventoried first**.

---

## 1. Teacher Screen Inventory (P0 Core)

| Screen ID | Screen Name | View Type | Priority | Primary User Action | Associated System States |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **SCR-TCH-01** | Teacher Dashboard | Full Page | **P0** | View pending attendance alerts and unreviewed support flags. | Empty (no classes today), Loading, Error, Loaded. |
| **SCR-TCH-02** | Morning Attendance Grid | Full Page | **P0** | Rapidly toggle student attendance chips (Present/Absent/Late); Bulk Submit. | Loading roster, Submitting (disabled), Success Toast, Offline Alert. |
| **SCR-TCH-03** | Attendance History Ledger| Tab / View | **P0** | Review historical monthly attendance; request admin override. | Empty (no past records), Loading, Loaded. |
| **SCR-TCH-04** | Course Resource Library | Tab / View | **P0** | Publish study guides, external video links, and course syllabus PDFs. | Empty (no resources), Uploading, Upload Success, Delete Modal. |
| **SCR-TCH-05** | Assignment Editor | Modal / Full | **P0** | Author coursework with title, instructions, max points, and due date. | Form Validation Errors (Zod), Saving, Published Toast. |
| **SCR-TCH-06** | Assignment Grading Queue | Full Page | **P0** | Review student submissions list with status (Submitted, Late, Missing). | Empty (no submissions yet), Filtering, Loaded. |
| **SCR-TCH-07** | Submission Grading Drawer | Drawer | **P0** | Inspect submitted text/file; enter score and qualitative feedback. | Loading attachment, Saving Grade, Error Banner, Saved. |
| **SCR-TCH-08** | Section Gradebook Table | Full Page | **P0** | Consolidated view of all student scores across assignments & assessments. | Empty gradebook, Loading aggregation, Cell Edit Mode. |
| **SCR-TCH-09** | Support Flags Queue | Full Page | **P0** | Triage proposed early warning flags; view transparent evidence. | Empty queue (all students on track), Loading, Filtered. |
| **SCR-TCH-10** | Flag Review Modal | Modal | **P0** | Validate flag to create plan, or dismiss flag with mandatory justification note. | Submitting review, Validation error (missing note), Success. |
| **SCR-TCH-11** | Support Plan Creator | Full Page | **P0** | Define SMART recovery goals, assign lead educator, and set review date. | Form validation, Saving, Activated Toast. |
| **SCR-TCH-12** | Support Plan Case View | Full Page | **P0** | Track action item checklist, assign tasks, and execute milestone review. | Action Item Toggled, Milestone Review Modal, Closed Plan. |

---

## 2. School Administrator Screen Inventory (P0 Core)

| Screen ID | Screen Name | View Type | Priority | Primary User Action | Associated System States |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **SCR-ADM-01** | School Admin Dashboard | Full Page | **P0** | Institutional KPIs (overall attendance %, active enrollments, support cases). | Loading metrics, Date range filter, Loaded. |
| **SCR-ADM-02** | Academic Years Manager | Tab / View | **P0** | Create academic terms; transition active term; archive past years. | Term Conflict Modal, Archive Warning Modal, Success. |
| **SCR-ADM-03** | Class & Section Setup | Tab / View | **P0** | Configure grade levels, section rooms, and maximum capacity. | Empty classes, Section editor modal, Saved. |
| **SCR-ADM-04** | Subject Curriculum Catalog| Tab / View | **P0** | Register subjects and curriculum codes (e.g. MATH-8). | Empty subjects, Duplicate code error, Saved. |
| **SCR-ADM-05** | Course Offering Matrix | Full Page | **P0** | Allocate subjects, sections, and assigned teachers. | Unassigned warning chip, Offering editor modal. |
| **SCR-ADM-06** | Staff Directory | Full Page | **P0** | Provision teacher accounts, assign employee IDs, deactivate staff. | Provision Staff Modal, Account Deactivated Banner. |
| **SCR-ADM-07** | Student Directory & Rosters| Full Page | **P0** | Provision student accounts, enroll students into sections. | Batch Enrollment Modal, Student Profile Drawer. |
| **SCR-ADM-08** | Institutional Audit Log | Full Page | **P0** | Filter immutable audit trail by actor, entity type, and date range. | Empty results, Loading audit stream, Detail Modal. |

---

## 3. Student Screen Inventory (P0 Core)

| Screen ID | Screen Name | View Type | Priority | Primary User Action | Associated System States |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **SCR-STU-01** | Student Dashboard | Full Page | **P0** | Today's schedule, pending homework deadlines, recent teacher feedback. | Empty (no pending work), Loading, Loaded. |
| **SCR-STU-02** | Course Resources Browser | Full Page | **P0** | Read syllabus guides, download study materials, open links. | Empty (no files), Download in progress, File preview. |
| **SCR-STU-03** | Assignment Submission View| Full Page | **P0** | Read instructions, enter response text, attach PDF/image file. | Uploading attachment, Confirm submit modal, Submitted. |
| **SCR-STU-04** | Graded Work & Feedback | Full Page | **P0** | View numerical score, letter grade, and constructive teacher comments. | Unreleased grade state, Graded with feedback card. |
| **SCR-STU-05** | Personal Progress View | Full Page | **P0** | View attendance percentage and active support goals in clear language. | Positive reinforcement card, Active goal progress bar. |

---

## 4. Parent / Guardian Screen Inventory (Priority P1)

| Screen ID | Screen Name | View Type | Priority | Primary User Action | Associated System States |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **SCR-PAR-01** | Parent Overview | Full Page | **P1** | Summary cards for linked child(ren) with attendance rate and alerts. | Loading, Multiple child selector, Loaded. |
| **SCR-PAR-02** | Child Attendance Ledger | Tab / View | **P1** | View monthly attendance calendar with absence notes. | Empty, Filtered by month, Absence notification chip. |
| **SCR-PAR-03** | Child Academic Grades | Tab / View | **P1** | View published coursework scores and term assessment results. | Empty (term starting), Graded cards. |
| **SCR-PAR-04** | Active Support Goals | Tab / View | **P1** | View collaborative Support Plan goals and recommended home actions. | No support needed card, Active plan progress view. |

---

## 5. Standard Component State Specifications

Every view in the system must explicitly model five distinct visual and accessible states:

1. **Empty State**: Rendered when no records exist (e.g. no support flags pending). Must include an accessible SVG illustration, clear explanatory copy (*"All students are currently on track"*), and a relevant primary call-to-action button where applicable.
2. **Loading State**: Rendered during initial data fetch. Must use accessible skeleton placeholders (`<div role="status" aria-label="Loading content...">`) matching the layout geometry to prevent visual layout shifts (CLS).
3. **Error State**: Rendered when an API call fails. Must present a high-contrast error banner explaining the problem in plain language with a visible *"Retry"* button.
4. **Disabled State**: Rendered during form submission or when an action is unavailable. Buttons show a spinner, set `disabled`, and declare `aria-busy="true"`.
5. **Success State**: Immediate visual confirmation upon mutation completion via high-contrast toast notifications (`role="status" aria-live="polite"`).
