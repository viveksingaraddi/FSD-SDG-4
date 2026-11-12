# Data Privacy, Protection, and Retention Policy

Educational data involving minor students requires the highest standard of ethical handling, legal compliance, and technological protection. This document defines the privacy, data governance, and data retention standards for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Core Data Privacy Principles

1. **Data Minimization**: The platform collects only the minimum personal data required to deliver educational services (e.g., student name, institutional ID, grade level, attendance, coursework). We do not collect biometric identifiers, home financial details, or government social security numbers.
2. **Purpose Limitation**: Data collected within an educational tenant is used strictly for school administration, academic tracking, and student support. Student data is **never** sold, rented, monetized, or used for targeted commercial advertising.
3. **Institutional Data Ownership**: The school tenant owns all institutional and student records. The SaaS platform acts strictly as a data processor / service provider.
4. **Non-Stigmatizing Record Keeping**: Student support flags and intervention notes are confidential pastoral records. They do not follow a student into public academic transcripts or external employer verifications.

---

## 2. Prohibition of Real PII in Development and Testing

> **ABSOLUTE GOVERNANCE MANDATE**:  
> Real student, educator, or parent Personally Identifiable Information (PII) must **NEVER** be imported into or stored within development, test, staging, or automated CI environments.

- **Synthetic Data Generation**: All fixtures, seed files, and automated end-to-end test data must be generated synthetically using deterministic seed algorithms (e.g., mock names like "Student 101", "Teacher Smith", synthetic email domains like `@tenant1.test`).
- **Audit Rule**: Automated static analysis tools in CI will scan fixtures and migration scripts for patterns resembling real phone numbers, real government IDs, or unapproved email domains.

---

## 3. Data Retention Lifecycle

| Data Category                    | Active Period          | Archival / Inactive Period | Final Disposition / Deletion Policy                                                                              |
| :------------------------------- | :--------------------- | :------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **User Credentials & Auth Logs** | Current active session | 90 days audit history      | Session records purged automatically after 30 days of inactivity. Security logs retained 90 days.                |
| **Daily Attendance Records**     | Active Academic Year   | 5 years post-completion    | Retained in read-only cold storage for statutory school audits; purged after 5 years or upon tenant deletion.    |
| **Assignments & Submissions**    | Active Academic Year   | 1 year post-completion     | Binary attachments (PDF/DOCX) purged 1 year after academic year completion; numerical grades retained.           |
| **Formal Assessment Results**    | Active Academic Year   | Indefinitely or 7 years    | Permanent academic record retained for official transcript generation per institutional policy.                  |
| **Support Flags & Action Plans** | Active Academic Year   | 2 years post-graduation    | Concluded support plans archived; accessible only to school admin/counselor; permanently expunged after 2 years. |
| **Decommissioned Tenants**       | Active subscription    | 30-day grace period        | Complete tenant cascade deletion across all relational tables after 30 days of confirmed contract termination.   |

---

## 4. Right to Erasure, Rectification & Export

- **Rectification**: School Administrators have the authority to correct factual errors in student records (e.g., name spelling, attendance override) with all changes logged in the immutable audit table.
- **Data Portability / Export**: School Administrators may request a complete export of their institutional data in open JSON/CSV format.
- **Erasure / Anonymization**: When a student or parent exercises a statutory right to erasure (subject to educational record retention laws), non-academic personal identifiers are wiped or replaced with irreversible pseudonyms (e.g., `DELETED_STUDENT_302`), preserving aggregate historical class statistics without identifying the individual.
