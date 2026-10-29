# Project Charter: FSD-SDG-4 Quality Education SaaS

## 1. Executive Summary & Purpose

The **FSD-SDG-4 Quality Education SaaS** project is a cloud-based, multi-tenant software-as-a-service application designed to empower primary and secondary educational institutions to advance United Nations Sustainable Development Goal 4 (Quality Education: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all").

Rather than operating merely as a passive administrative record-keeper, the platform addresses a fundamental failure mode in contemporary educational software: the disconnection between routine administrative tracking and timely, personalized academic support.

The platform operationalizes a human-in-the-loop pedagogical feedback lifecycle:

$$\text{RECORD} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{FLAG} \longrightarrow \text{SUPPORT} \longrightarrow \text{REVIEW}$$

1. **RECORD**: Capture essential daily academic interactions (attendance, course offerings, assignments, grades, assessments) with minimal friction.
2. **UNDERSTAND**: Aggregate and normalize longitudinal academic data into meaningful student progress snapshots.
3. **FLAG**: Detect early indicators of disengagement, learning difficulties, or chronic absenteeism using transparent, explainable thresholds.
4. **SUPPORT**: Enable educators to design structured, collaborative, actionable intervention plans.
5. **REVIEW**: Periodically evaluate intervention outcomes, adjust strategies, and close the loop.

---

## 2. Core Value Propositions

- **Actionable Pastoral & Academic Support**: Transforms raw administrative data into early, proactive student support before learning gaps become insurmountable.
- **Explainable & Ethical Student Flagging**: Avoids black-box algorithmic determinations; all indicators are transparent, non-punitive, and subject to human review.
- **Resource-Constrained Optimization**: Engineered specifically for low-bandwidth environments, mobile-first workflows, and shared-device scenarios common in under-resourced schools.
- **Strict Multi-Tenant Privacy & Security**: Institutional data is strictly isolated by school tenant, protecting sensitive minor educational records against unauthorized cross-tenant exposure.
- **WCAG 2.2 AA Accessibility**: Ensures that teachers, students, and administrators of all abilities can participate equally in educational workflows.

---

## 3. High-Level Scope & Stakeholder Communities

### Primary User Communities
- **Platform Super Administrators**: Cloud operators managing tenant onboarding, subscription health, platform security, and cross-tenant auditing.
- **School Administrators**: Institutional leaders managing academic years, grade levels, sections, subjects, staff allocations, and institutional performance metrics.
- **Teachers**: Educators recording attendance, curating learning resources, distributing coursework, grading submissions, observing student trajectories, and managing intervention plans.
- **Students**: Learners accessing learning materials, submitting assignments, tracking academic progress, and receiving constructive feedback.
- **Parents / Guardians (P1)**: Families staying informed about attendance patterns, academic milestones, and collaborative support initiatives.

---

## 4. Key Constraints & Operational Guardrails

- **Zero Tolerance for Unreviewed Algorithmic Labeling**: No automated flag may permanently categorize a student or trigger punitive disciplinary actions without mandatory teacher or administrator verification.
- **Strict Tenant Separation**: All transactional database queries and API routes must enforce strict cryptographic session-bound tenant filtering.
- **Phase-Gated Development**: Development strictly follows an incremental 16-phase lifecycle. Implementation of code or schema migrations is strictly prohibited until Phase 4 and Phase 5 respectively.
- **Low-Bandwidth Resiliency**: The user interface must load efficiently on 3G connections (initial bundle payload < 250 KB compressed) and provide clear offline indicators when connectivity drops.
