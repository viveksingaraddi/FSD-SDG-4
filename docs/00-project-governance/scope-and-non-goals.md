# Scope and Non-Goals: FSD-SDG-4 Quality Education SaaS

This document establishes the precise boundaries of the FSD-SDG-4 Quality Education SaaS platform. Strict adherence to these boundaries prevents scope creep and ensures the small engineering team focuses on delivering a robust, accessible, multi-tenant core.

---

## 1. In-Scope: Initial Release (Priority P0)

The P0 scope represents the minimal viable production platform required to deliver the core educational loop ($\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$).

### 1.1 Identity, Tenancy & Security
- Multi-tenant architecture with logical isolation per school (`school_id`).
- Role-Based Access Control (RBAC) supporting: Platform Super Admin, School Admin, Teacher, Student.
- Server-managed authentication sessions with `HttpOnly`, `Secure`, `SameSite` session cookies.
- Argon2id password hashing and account lockout / rate limiting on authentication routes.
- Tenant-scoped audit logging for sensitive academic and administrative actions.

### 1.2 School & Academic Setup
- School onboarding, tenant profile configuration, and academic year lifecycle management (Active, Completed, Archived).
- Class (grade level), Section, Subject, and Course Offering structure.
- Staff (teacher) and Student profile creation, profile management, and class/section enrollments.

### 1.3 Daily Academic Operations
- Daily attendance recording by class/section with statuses: Present, Absent, Late, Excused.
- Learning resource repository (document uploads, curated external links, markdown reading guides) scoped by subject and course offering.
- Assignment publishing with deadlines, rich-text instructions, file attachments, and student submission tracking.
- Assessment and examination recording with standardized scoring, subject weighting, and historical result logging.
- Structured pedagogical feedback from teachers to students on submissions and assessments.

### 1.4 Student Progress & Intervention Loop
- Student progress snapshots aggregating longitudinal attendance rates and weighted assignment/assessment scores.
- Rule-based, explainable Support Flags triggered by objective thresholds (e.g., attendance < 75%, failing grades across consecutive assessments, missing submissions).
- Support Plan creation: assigning an intervention lead (teacher/counselor), defining actionable SMART goals, and tracking action item completion.
- Support Plan Review: outcome evaluation, goal adjustment, and formal closing or continuation of support.

### 1.5 User Experience & Accessibility
- Mobile-first responsive web design operating smoothly on mobile devices, tablets, and desktop workstations.
- WCAG 2.2 AA compliance: keyboard navigation, screen-reader semantics, high contrast modes, accessible focus rings.
- Low-bandwidth optimizations: lightweight asset payloads, defensive loading states, client-side caching of static curriculum metadata.
- Shared-device safeguards: prominent logout, session timeout warnings, and cache clearing prompts on shared terminals.

---

## 2. In-Scope: Secondary Release (Priority P1)

P1 capabilities will be designed and mapped in Phase 0 architecture but deferred to Phase 14 implementation unless otherwise authorized:
- **Parent / Guardian Portal**: Dedicated parent accounts linked to student profiles; read-only access to attendance history, assignment grades, teacher feedback, and active support plans.
- **Automated Guardian Notifications**: SMS / Email alerts for unexcused student absences or new support plan initiations.
- **Bulk CSV Data Import/Export**: Administrative bulk onboarding tools for students, staff, and historical academic transcripts.
- **Configurable School Grading Scales**: Institutional customization of letter grade boundaries and GPA formulas.
- **Advanced Export Formats**: PDF report cards and official school transcript generation.

---

## 3. Explicit Non-Goals (Out of Scope)

The following capabilities are explicitly **excluded** from the platform architecture and must NOT be designed or implemented:

1. **Complex Financial Billing & Tuition Payment Processing**:  
   *Reason*: Integrating payment gateways, invoicing, tax compliance, and fee collection adds massive PCI-DSS complexity unrelated to SDG-4 core learning goals.
2. **Real-Time Video Conferencing & Streaming**:  
   *Reason*: The platform will not attempt to replicate Zoom or Google Meet. External video conferencing links can be attached to learning resources, but WebRTC infrastructure will not be built.
3. **Automated AI Grading / Essay Evaluation**:  
   *Reason*: Automated AI essay grading introduces significant pedagogical risk, bias, and hallucination. All assessment grading and qualitative feedback must remain human-directed.
4. **Autonomous Algorithmic Student Categorization**:  
   *Reason*: The platform will never assign autonomous psychiatric, behavioral, or permanent academic labels to students. All support flags are advisory indicators requiring teacher validation.
5. **Hardware IoT Integration (Biometric Fingerprint / RFID Timeclocks)**:  
   *Reason*: Attendance must be recordable via standard web interfaces on mobile or desktop without proprietary hardware dependencies.
6. **School Transportation, Bus Fleet Routing & Cafeteria Management**:  
   *Reason*: Facility management and logistical routing detract from the core focus of academic progress and student support.
7. **Social Media Feeds & Public Student Portfolios**:  
   *Reason*: To safeguard minor privacy and avoid COPPA/GDPR compliance risks, student data remains strictly private within the institutional tenant.
