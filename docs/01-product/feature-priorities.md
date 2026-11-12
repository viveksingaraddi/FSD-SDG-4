# Feature Priorities (MoSCoW Framework - Phase 1 Validated)

This document establishes the feature priority hierarchy for the **FSD-SDG-4 Quality Education SaaS** platform using the MoSCoW framework.

---

## 1. Priority P0: Must Have (Initial Core Release)

These capabilities are mandatory to complete the core educational loop ($\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$). Without these, the product cannot launch.

| Domain                    | Feature Capability                                                                                      | Architectural Justification                                               |
| :------------------------ | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **Identity & Tenancy**    | Multi-tenant auth, server-managed sessions, HttpOnly cookies, RBAC, Argon2id.                           | Non-negotiable security and student privacy baseline.                     |
| **School Setup**          | School registration, academic year lifecycle, classes, sections, subjects, course offerings.            | Foundational data taxonomy required for all subsequent school operations. |
| **User Management**       | Teacher and Student profile creation, section enrollments.                                              | Roster management required for classroom association.                     |
| **Attendance**            | Daily section attendance recording (Present, Absent, Late, Excused), bulk roster submission.            | Primary daily operational touchpoint for teachers ($\le 90$s).            |
| **Learning Resources**    | Subject-scoped resource curation (markdown guides, URLs, file attachments).                             | Core academic distribution channel.                                       |
| **Assignments & Grading** | Assignment creation, digital submissions, points grading, structured feedback.                          | Core assessment and student evaluation mechanism.                         |
| **Assessments**           | Formal assessment definition, weighted scoring, class gradebook views.                                  | Longitudinal academic tracking.                                           |
| **Student Progress**      | Longitudinal progress snapshots aggregating attendance and academic scores.                             | Quantitative basis for early student support detection.                   |
| **Support Flags & Plans** | Rule-based explainable flags, mandatory human review, Support Plan creation, SMART goals, review cycle. | **The primary educational value proposition of the SaaS.**                |
| **Accessibility & UX**    | WCAG 2.2 AA compliance, mobile-first responsive layout, shared-device privacy.                          | Essential for equitable access in low-resource environments.              |

---

## 2. Priority P1: Should Have (Secondary Release / OQ-002 Scope Review)

These capabilities provide substantial operational value and are assigned to Phase 14 unless Option B of OQ-002 is authorized:

| Domain                     | Feature Capability                                                                                                        |          Phase Target           | OQ-002 Dependency                         |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :-----------------------------: | :---------------------------------------- |
| **Parent Portal**          | Dedicated Parent/Guardian accounts linked to student profiles; read-only attendance, grades, and support plan visibility. | Phase 14 (or P0 under Option B) | **Pending PO Decision OQ-002**            |
| **Automated Alerts**       | Automated email / SMS alerts to guardians upon unexcused student absences or support plan milestone completion.           |            Phase 14             | Dependent on notification provider setup. |
| **Bulk Data Ingestion**    | Administrative bulk CSV upload for student and staff onboarding, with validation error reporting.                         |            Phase 14             | Accelerates large school onboarding.      |
| **Password Self-Service**  | Out-of-band email-based password reset token generation and verification.                                                 |            Phase 14             | Self-service credential recovery.         |
| **Report Card PDF Export** | Standardized PDF report card generation for printing or digital distribution.                                             |            Phase 14             | Formal student transcript reporting.      |

---

## 3. Priority P2: Could Have (Future Enhancements)

- **Offline Attendance Caching**: Full PWA Service Worker caching with local IndexedDB queuing (Spike assigned to Phase 2 under OQ-003).
- **Configurable Grading Scales**: School-customizable grading rubrics (letter grades vs. 4.0 GPA vs. competency-based criteria).
- **Curriculum Standard Tagging**: Aligning assignments and learning resources to specific regional or national curriculum benchmarks.
- **Multilingual UI Support**: Interface localization into regional languages (Hindi, Swahili, French, Spanish).

---

## 4. Won't Have (Explicit Exclusions)

The following features remain explicitly excluded from platform scope:

- Complex tuition billing, fee invoicing, and payment processing.
- Native video conferencing and streaming (e.g., Zoom/Meet clones).
- Autonomous AI essay grading or algorithmic student evaluation replacing human teachers.
- Biometric hardware timeclocks or RFID scanning integrations.
- School bus fleet transit routing and cafeteria food services.
