# Role-Based Sitemap Specification

This document defines the comprehensive role-based sitemap, route paths, view titles, and permission guards for the **FSD-SDG-4 Quality Education SaaS** frontend application.

---

## 1. Public & Authentication Routes

- `/login`: Public sign-in page (Email, Password, Tenant Subdomain).
- `/password-reset/request` (P1): Request password reset email.
- `/password-reset/confirm` (P1): Consume reset token and establish new password.
- `/404`: Accessible Not Found error page.
- `/403`: Access Denied view with guidance to request role permissions.

---

## 2. Teacher Portal Sitemap (Primary Pedagogical Workspace)

- `/teacher/dashboard`: Daily schedule, pending attendance banners, urgent support flags.
- `/teacher/classes`: List of assigned class sections and active course offerings.
  - `/teacher/classes/:sectionId/attendance`: **Fast Morning Attendance Roster Grid**.
  - `/teacher/classes/:sectionId/attendance/history`: Monthly section attendance audit ledger.
  - `/teacher/classes/:sectionId/roster`: Enrolled student roster with progress badges.
- `/teacher/course-offerings/:offeringId`:
  - `/teacher/course-offerings/:offeringId/resources`: Syllabus documents, reading guides, URLs.
  - `/teacher/course-offerings/:offeringId/assignments`: Published homework and project list.
  - `/teacher/course-offerings/:offeringId/assignments/new`: Assignment creation form.
  - `/teacher/assignments/:assignmentId/grading`: Submission queue and digital grading drawer.
  - `/teacher/course-offerings/:offeringId/assessments`: Formal exams and tests.
  - `/teacher/course-offerings/:offeringId/gradebook`: Tabular weighted gradebook view.
- `/teacher/students/:studentId`: Complete student profile, longitudinal progress, attendance rate.
- `/teacher/support`:
  - `/teacher/support/queue`: Unreviewed `PROPOSED` early warning flags queue.
  - `/teacher/support/plans`: Active and archived Support Plans.
  - `/teacher/support/plans/new`: Support Plan drafting wizard (SMART goals, action items).
  - `/teacher/support/plans/:planId`: Plan case view, action item checklist, review milestone editor.

---

## 3. School Administrator Portal Sitemap

- `/school/dashboard`: School-wide attendance rate, enrollment counts, active flags summary.
- `/school/academic-years`: Academic year list, term date editor, status transition controls.
- `/school/classes`: Grade levels (Classes) and Section setup.
- `/school/subjects`: Curriculum subject definitions and course offering manager.
- `/school/staff`: Teacher profile catalog, employee provisioning, course allocations.
- `/school/students`: Student directory, admission onboarding, section enrollment manager.
- `/school/support-overview`: School-wide pastoral care analytics, escalated support plans.
- `/school/audit-log`: Immutable security and data mutation audit trail.
- `/school/settings`: School profile, institutional branding, calendar rules.

---

## 4. Student Portal Sitemap (Mobile-First Learner View)

- `/student/dashboard`: Today's classes, upcoming assignment deadlines, recent feedback.
- `/student/courses`: Enrolled subjects list and published learning resources.
- `/student/assignments`:
  - `/student/assignments/pending`: Unsubmitted homework tasks.
  - `/student/assignments/:assignmentId/submit`: Digital coursework upload and text entry.
  - `/student/assignments/completed`: Graded work with teacher feedback and scores.
- `/student/progress`: Personal attendance percentage, subject grades, active personal goals.

---

## 5. Parent / Guardian Portal Sitemap (Priority P1)

- `/parent/dashboard`: Overview cards for linked children.
- `/parent/children/:studentId`:
  - `/parent/children/:studentId/attendance`: Monthly attendance calendar and absence alerts.
  - `/parent/children/:studentId/grades`: Published assignment and assessment grades.
  - `/parent/children/:studentId/support-goals`: Active Support Plan goals and home collaboration steps.

---

## 6. Platform Super Admin Portal Sitemap

- `/admin/dashboard`: Global SaaS health, total active tenants, server load telemetry.
- `/admin/schools`: School tenant provisioning, subscription lifecycle, tenant search.
- `/admin/schools/:schoolId`: Deep-dive tenant configuration and audit log inspection.
- `/admin/system-logs`: Cross-tenant security event stream and error telemetry.
