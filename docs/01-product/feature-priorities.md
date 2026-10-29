# Feature Priorities (MoSCoW Framework)

This document establishes the feature priority hierarchy for the **FSD-SDG-4 Quality Education SaaS** platform using the MoSCoW framework (Must Have, Should Have, Could Have, Won't Have).

---

## 1. Priority P0: Must Have (Initial Core Release)

These capabilities are mandatory to complete the core educational loop ($\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$). Without these, the product cannot launch.

| Domain | Feature Capability | Architectural Justification |
| :--- | :--- | :--- |
| **Identity & Tenancy** | Multi-tenant auth, server-managed sessions, HttpOnly cookies, RBAC, Argon2id. | Non-negotiable security and student privacy baseline. |
| **School Setup** | School registration, academic year lifecycle, classes, sections, subjects, course offerings. | Foundational data taxonomy required for all subsequent school operations. |
| **User Management** | Teacher and Student profile creation, section enrollments. | Roster management required for classroom association. |
| **Attendance** | Daily section attendance recording (Present, Absent, Late, Excused), bulk roster submission. | Primary daily operational touchpoint for teachers. |
| **Learning Resources** | Subject-scoped resource curation (markdown guides, URLs, file attachments). | Core academic distribution channel. |
| **Assignments & Grading** | Assignment creation, digital submissions, points grading, structured feedback. | Core assessment and student evaluation mechanism. |
| **Assessments** | Formal assessment definition, weighted scoring, class gradebook views. | Longitudinal academic tracking. |
| **Student Progress** | Longitudinal progress snapshots aggregating attendance and academic scores. | Quantitative basis for early student support detection. |
| **Support Flags & Plans** | Rule-based explainable flags, mandatory human review, Support Plan creation, SMART goals, review cycle. | **The primary educational value proposition of the SaaS.** |
| **Accessibility & UX** | WCAG 2.2 AA compliance, mobile-first responsive layout, shared-device privacy. | Essential for equitable access in low-resource environments. |

---

## 2. Priority P1: Should Have (Secondary Release)

These capabilities provide substantial operational value and will be implemented in Phase 14 (or as fast-follow iterations) once the P0 core is hardened.

| Domain | Feature Capability | Phase Target |
| :--- | :--- | :---: |
| **Parent Portal** | Dedicated Parent/Guardian accounts linked to student profiles; read-only attendance, grades, and support plan visibility. | Phase 14 |
| **Automated Alerts** | Automated email / SMS alerts to guardians upon unexcused student absences or support plan milestone completion. | Phase 14 |
| **Bulk Data Ingestion** | Administrative bulk CSV upload for student and staff onboarding, with validation error reporting. | Phase 14 |
| **Password Self-Service** | Out-of-band email-based password reset token generation and verification. | Phase 14 |
| **Report Card PDF Export** | Standardized PDF report card generation for printing or digital distribution. | Phase 14 |

---

## 3. Priority P2: Could Have (Future Enhancements)

Valuable enhancements to be evaluated post-release based on user feedback and operational data:

- **Offline Attendance Caching**: Full PWA Service Worker caching with local IndexedDB queuing for remote rural teachers recording attendance during internet outages.
- **Configurable Grading Scales**: School-customizable grading rubrics (e.g., standard letter grades vs. 4.0 GPA vs. competency-based criteria).
- **Curriculum Standard Tagging**: Aligning assignments and learning resources to specific regional or national curriculum benchmarks.
- **Multilingual UI Support**: Interface localization into regional languages (e.g., Hindi, Swahili, French, Spanish).

---

## 4. Won't Have (Explicit Exclusions)

To protect team velocity and maintain focus on SDG-4 outcomes, the following features will **never** be incorporated into this platform:
- Complex tuition billing, fee invoicing, and payment processing.
- Native video conferencing and streaming (e.g., Zoom/Meet clones).
- Autonomous AI essay grading or algorithmic student evaluation replacing human teachers.
- Biometric hardware timeclocks or RFID scanning integrations.
- School bus fleet transit routing and cafeteria food services.
