# Core User Workflows

This document details the primary step-by-step user workflows for the **FSD-SDG-4 Quality Education SaaS** platform. In accordance with pedagogical priorities, **Teacher workflows are documented first**, followed by School Administrator, Student, and Parent workflows.

---

## 1. Teacher Workflows (Primary Pedagogical Operator)

### Workflow T-01: Morning Attendance Recording ($\le 90$s Roster Flow)

1. **Login & Landing**: Teacher logs in on smartphone or desktop; the Teacher Dashboard immediately surfaces the **Pending Attendance** card for today's active morning classes.
2. **Open Section Roster**: Teacher taps _"Take Attendance — Section 8-A"_.
3. **Roster Display**: The full class roster of 32 students loads, pre-populated with status `PRESENT` (green indicator).
4. **Fast Toggle**:
   - Student #4 (Dev) is not in room: Teacher taps his status chip once $\to$ switches to `ABSENT` (red indicator).
   - Student #12 (Sara) walks in 10 minutes late: Teacher taps twice $\to$ switches to `LATE` (amber indicator) and optionally adds note _"10 mins late"_.
5. **Submit**: Teacher clicks _"Submit Section Attendance"_.
6. **Confirmation & Sync**: Server validates payload; returns confirmation; dashboard card updates to _"Submitted at 08:15 AM"_. Total interaction time: $\approx 45$ seconds.

### Workflow T-02: Assignment Publishing and Digital Grading

1. **Create Assignment**: Teacher navigates to _Course Offering: Grade 8 Mathematics_ $\to$ clicks _"New Assignment"_.
2. **Form Entry**: Inputs title (_"Fractions & Ratios Problem Set 3"_), instructions in markdown, max points ($50$), due date (Friday 5:00 PM), and attaches PDF worksheet.
3. **Publish**: Teacher clicks _"Publish to Students"_; assignment appears immediately in student portals.
4. **Review Submissions**: Following the deadline, teacher opens assignment grading queue showing submitted, late, and unsubmitted students.
5. **Grading & Feedback**: For each student:
   - Views submitted text / attachment.
   - Enters score (e.g., $42/50$).
   - Enters constructive pedagogical feedback (e.g., _"Excellent work on ratio simplification; review question 4 where common denominators were omitted"_).
6. **Publish Grades**: Teacher clicks _"Return Grades & Feedback"_; student dashboard receives instant notification.

### Workflow T-03: The Support Intervention Loop ($\text{Flag} \to \text{Plan} \to \text{Review}$)

1. **Review Flagged Student**: Teacher dashboard highlights an amber badge: _"1 New Support Flag: Amina (Grade 8) — Attendance Risk"_.
2. **Inspect Evidence**: Teacher clicks the flag; modal shows transparent evidence: _"Attendance rate 68% over last 30 days (4 unexcused absences, 2 missing assignments in Math)"_.
3. **Validate Flag**: Teacher confirms the flag and clicks _"Create Support Plan"_.
4. **Draft Support Plan**:
   - Assigns Lead Educator: Self (Mr. Daniel).
   - Problem Statement: _"Attendance drops on Mondays and missing algebra foundational exercises."_
   - Target Goal: _"Achieve $\ge 90\%$ attendance over next 3 weeks and complete 3 remedial worksheets."_
   - Action Items:
     1. Phone check-in with guardian (Due: Oct 31, Assignee: Mr. Daniel).
     2. Assign peer-study partner for algebra (Due: Nov 02, Assignee: Mr. Daniel).
   - Sets Review Date: November 21 (3 weeks).
5. **Save & Activate**: Plan becomes active; student progress card now tracks intervention milestones.
6. **Execute Review**: On November 21, system reminds teacher of review date. Teacher records progress notes, verifies attendance recovered to 92%, and marks Support Plan as `RESOLVED`.

---

## 2. School Administrator Workflows (Institutional Setup)

### Workflow A-00: Guided School Administrator Onboarding & Initial Setup Wizard

1. **First-Login Prompt & Navigation**: Upon successful account activation and initial sign-in, the School Administrator is welcomed by the **Initial School Setup Wizard** (`/admin/onboarding`), or prompted via the prominent setup progress widget on the School Dashboard (`/admin`).
2. **Step 1 — School Profile Verification**: Admin verifies the provisioned school name, unique code, subdomain, and administrative contact email.
3. **Step 2 — Academic Year Configuration**: Admin configures the active academic calendar (start/end dates) and sets it to `ACTIVE`.
4. **Step 3 — Grade Levels & Class Sections**: Admin defines classes (e.g. Grade 9, Secondary) and provisions class sections (e.g. Section A, Section B) bound to the active academic year.
5. **Step 4 — Curriculum Subject Catalog**: Admin registers core subjects (e.g. Mathematics, Sciences, English Language Arts) with course codes and descriptions.
6. **Step 5 — Faculty Onboarding**: Admin invites teachers via the official Gmail/Nodemailer delivery system, establishing initial instructional capacity.
7. **Step 6 — Student Enrollment**: Admin registers enrolled students with student ID numbers, admission dates, and section placements.
8. **Step 7 — Parent / Guardian Linking**: Admin invites parents and guardians with mandatory student profile links to establish zero-trust, authorized record access boundaries.
9. **Step 8 — Setup Summary & Platform Activation**: Admin reviews institutional configuration metrics, saves progress bookmark to backend, and clicks _"Complete Setup & Launch Dashboard"_, recording the `SCHOOL_ONBOARDING_COMPLETED` audit event and entering the active School Administrator Dashboard.

### Workflow A-01: Academic Year & Curriculum Initialization

1. **Create Academic Year**: Admin navigates to _School Settings_ $\to$ _Academic Years_ $\to$ creates _"2026–2027 Academic Year"_ with start and end dates. Sets status to `ACTIVE`.
2. **Define Classes & Sections**: Admin defines Grade 8 with sections _"8-A"_ and _"8-B"_.
3. **Define Subjects**: Admin registers standard curriculum subjects: Mathematics (MATH-8), English Language Arts (ENG-8), General Science (SCI-8).
4. **Establish Course Offerings**: Admin creates Course Offering linking _Grade 8-A + Mathematics + Mr. Daniel_.

### Workflow A-02: Student & Staff Enrollment

1. **Staff Provisioning**: Admin registers teacher Mr. Daniel with email and system credentials.
2. **Student Provisioning**: Admin registers new student profiles with ID numbers and admission dates.
3. **Roster Enrollment**: Admin enrolls Grade 8 students into Section 8-A for the 2026–2027 Academic Year.

---

## 3. Student Workflows (Learner Portal)

### Workflow S-01: Accessing Coursework and Submitting Assignments

1. **Login**: Student logs in on mobile browser using institutional credentials.
2. **Student Dashboard**: Displays current schedule, announcements, and a _"Due This Week"_ card.
3. **View Assignment**: Taps _"Fractions Problem Set 3 — Due Friday"_. Reads instructions and downloads reference PDF.
4. **Submit Work**: Taps _"Submit Assignment"_; uploads completed photo or PDF; enters brief message; clicks _"Confirm Submission"_.
5. **Review Feedback**: Once graded, receives notification; opens assignment to view numerical score ($42/50$) and teacher's constructive feedback notes.

---

## 4. Parent / Guardian Workflows (Priority P1)

### Workflow P-01: Progress and Attendance Review

1. **Parent Login**: Guardian logs in via mobile browser and selects linked child ("Amina").
2. **Parent View**: Displays clean summary cards:
   - Monthly Attendance: $92\%$ (3 absences, 0 unexcused this month).
   - Current Course Subjects & Recent Grades.
   - Active Support Plan Goals: _"Goal: 90% attendance; Status: On Track"_.
3. **No Direct Interruption**: Parents can view progress and support milestones without overwhelming teachers with administrative messaging.
