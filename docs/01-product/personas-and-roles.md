# Personas and Roles

This document defines the five primary user personas, their real-world technical environments, core motivations, operational pain points, and system access boundaries within the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Platform Super Admin (Global Operator)

- **Archetype**: _SaaS Systems Operations Engineer (Platform Administrator)_
- **Primary Objective**: Ensure overall SaaS platform availability, onboard institutional tenants, oversee billing and subscription tiers, monitor cross-tenant security health, and audit system-wide errors.
- **Operating Environment**: High-performance desktop workstation, modern Chromium/Firefox browser, high-speed broadband connection.
- **Key Pain Points**:
  - Risk of unintended cross-tenant data leaks or unauthorized data access.
  - Difficulty diagnosing tenant-specific performance degradations without violating tenant privacy.
  - Manual friction in provisioning and decommissioning educational tenants.
- **System Permissions**:
  - Global tenant provisioning, suspension, and deletion (`School` records).
  - Cross-tenant system configuration and feature-flag toggling.
  - Platform audit log inspection and security telemetry review.
  - _Boundary Constraint_: Cannot view individual student grades, support plans, or personal academic content unless explicitly authorized for a forensic support session.

---

## 2. School Administrator (Institutional Leader)

- **Archetype**: _Principal, Vice-Principal, or Academic Registrar (e.g., "Principal Sarah")_
- **Primary Objective**: Configure the school's digital presence, structure academic years, manage grade levels, sections, and subjects, allocate teaching staff, oversee enrollment, and track school-wide academic health.
- **Operating Environment**: Office desktop or laptop computer, school Wi-Fi or broadband, shared administrative printer.
- **Key Pain Points**:
  - Disconnected spreadsheets making teacher allocation and class scheduling cumbersome.
  - Inability to detect institutional attendance drops or grade anomalies until end-of-term reporting.
  - Inadequate audit trails when disputes arise over attendance or grade modifications.
- **System Permissions**:
  - Tenant-level academic configuration: Academic Years, Classes, Sections, Subjects, and Course Offerings.
  - User onboarding: Teacher and Student account creation, roster enrollments, and status deactivations.
  - School-wide aggregated analytics and attendance/gradebook oversight.
  - Approval and oversight of escalated Student Support Plans.

---

## 3. Teacher (Educator & Interventionist)

- **Archetype**: _Classroom Teacher & Academic Advisor (e.g., "Mr. Daniel, Grade 8 Math & Science")_
- **Primary Objective**: Quickly record daily section attendance, distribute course resources, assign homework, record test scores, monitor student progress, identify struggling learners early, and execute targeted support plans.
- **Operating Environment**: Mid-tier Android smartphone, personal budget laptop, shared staff-room desktop, intermittent 3G or school Wi-Fi.
- **Key Pain Points**:
  - Spending 15+ minutes every morning on administrative paperwork instead of teaching.
  - Lack of timely visibility when a student is quietly disengaging across multiple subjects.
  - Unstructured, ad-hoc remedial efforts that are forgotten and never reviewed.
- **System Permissions**:
  - Attendance recording and updating for assigned sections.
  - Learning resource publishing and management for assigned subjects.
  - Assignment creation, submission reviewing, grading, and structured pedagogical feedback.
  - Student progress viewing and support flag review/creation.
  - Initiation, action item management, and outcome review of Support Plans.

---

## 4. Student (Learner & Participant)

- **Archetype**: _Secondary School Learner (e.g., "Amina, 14 years old, Grade 8")_
- **Primary Objective**: View class announcements and syllabus materials, check assignment instructions and due dates, submit homework digitally, review teacher feedback and grades, and monitor personal academic progress.
- **Operating Environment**: Low-cost smartphone (shared with siblings or parents), shared computer lab terminal, mobile data with bandwidth limits.
- **Key Pain Points**:
  - Confusing user interfaces that consume excessive mobile data.
  - Not knowing why a grade was received or what concrete steps to take to improve.
  - Missing assignment deadlines due to lack of a centralized, clear schedule.
  - Privacy concerns when accessing portals on shared devices.
- **System Permissions**:
  - Read-only access to enrolled subjects, schedules, and learning resources.
  - Assignment submission (text and file attachments) and submission history viewing.
  - Viewing personal attendance records, grades, teacher feedback, and active personal support goals.
  - _Boundary Constraint_: Strictly prohibited from viewing other students' grades, attendance, submissions, or support flags.

---

## 5. Parent / Guardian (Collaborative Supporter — Priority P1)

- **Archetype**: _Parent, Guardian, or Family Caregiver (e.g., "Mrs. Fatima, Mother of Amina")_
- **Primary Objective**: Stay informed about their child's daily attendance, academic milestones, pending assignments, and collaborative support initiatives.
- **Operating Environment**: Budget mobile smartphone, messaging-centric (WhatsApp/SMS familiarity), intermittent data connectivity.
- **Key Pain Points**:
  - Finding out about student truancy or failing grades weeks after the fact.
  - Complex educational jargon in formal report cards.
  - Feeling excluded from remedial support plans initiated by the school.
- **System Permissions (P1 Scope)**:
  - Read-only access to linked student(s) attendance history, grades, and teacher feedback.
  - Visibility into active student Support Plans and recommended home-support actions.
  - Direct read-only receipt of school administrative notices and attendance alerts.
  - _Boundary Constraint_: Can only access verified linked children; zero access to classmates' data.
