# Success Metrics & Key Performance Indicators

The success of the FSD-SDG-4 Quality Education SaaS platform is evaluated across three core dimensions: **Educational Impact Metrics**, **System Performance & Reliability SLAs**, and **Accessibility & Operational Quality Metrics**.

---

## 1. Educational & Product Impact Metrics

These metrics quantify how effectively the platform realizes the $\text{RECORD} \to \text{UNDERSTAND} \to \text{FLAG} \to \text{SUPPORT} \to \text{REVIEW}$ loop.

| Metric Identifier | Metric Name                        | Definition & Measurement Method                                                                                        | Target Baseline     |
| :---------------- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :------------------ |
| **KPI-EDU-01**    | **Intervention Timeliness**        | Median time elapsed between a student triggering a support flag and a teacher initiating a formal Support Plan.        | $\le 5$ school days |
| **KPI-EDU-02**    | **Intervention Completion Rate**   | Percentage of active Support Plans that undergo scheduled review and achieve targeted student recovery goals.          | $\ge 70\%$          |
| **KPI-EDU-03**    | **Attendance Record Completeness** | Percentage of scheduled class sessions where attendance is submitted before the conclusion of the school day.          | $\ge 95\%$          |
| **KPI-EDU-04**    | **Feedback Turnaround Time**       | Median business days between student assignment submission and teacher feedback publication.                           | $\le 4$ school days |
| **KPI-EDU-05**    | **Flag False-Positive Resolution** | Percentage of automated support flags reviewed and marked with explicit human rationale (confirm, dismiss, or adjust). | $100\%$ reviewed    |

---

## 2. Technical Performance & Reliability SLAs

These metrics ensure the platform remains stable, responsive, and resilient even under heavy morning attendance load or constrained school connectivity.

| Metric Identifier | Metric Name                        | SLA Target           | Measurement Threshold / Protocol                                                                   |
| :---------------- | :--------------------------------- | :------------------- | :------------------------------------------------------------------------------------------------- |
| **KPI-TECH-01**   | **API P95 Response Latency**       | $\le 200\text{ ms}$  | Measured across all standard CRUD read/write endpoints under 50 RPS load.                          |
| **KPI-TECH-02**   | **Complex Aggregation Latency**    | $\le 600\text{ ms}$  | P95 latency for longitudinal student progress snapshots and class gradebook views.                 |
| **KPI-TECH-03**   | **Platform Availability (Uptime)** | $\ge 99.5\%$         | Calculated monthly, excluding scheduled maintenance windows during off-peak hours.                 |
| **KPI-TECH-04**   | **Initial Client Bundle Payload**  | $\le 250\text{ KB}$  | Gzipped/Brotli compressed JavaScript/CSS asset payload delivered on first load.                    |
| **KPI-TECH-05**   | **Tenant Isolation Defect Rate**   | **$0.00\%$**         | Absolute zero cross-tenant data leakage incidents; verified via automated CI isolation test suite. |
| **KPI-TECH-06**   | **RPO (Recovery Point Objective)** | $\le 1\text{ hour}$  | Maximum acceptable data loss window during automated disaster recovery.                            |
| **KPI-TECH-07**   | **RTO (Recovery Time Objective)**  | $\le 2\text{ hours}$ | Maximum acceptable downtime to restore platform from disaster backup.                              |

---

## 3. Usability, Accessibility & Inclusion Metrics

These metrics guarantee that the platform remains universally usable by students, teachers, and administrators across diverse devices and accessibility needs.

| Metric Identifier | Metric Name                           | Target Benchmark             | Verification Tool                                                                    |
| :---------------- | :------------------------------------ | :--------------------------- | :----------------------------------------------------------------------------------- |
| **KPI-A11Y-01**   | **WCAG 2.2 AA Automated Conformance** | $0$ Level A / AA violations  | Automated `axe-core` CI test runs across all registered screens.                     |
| **KPI-A11Y-02**   | **Keyboard Navigability**             | $100\%$ Interactive Elements | Every button, form input, modal, and menu operable without pointer device.           |
| **KPI-A11Y-03**   | **Lighthouse Performance Score**      | $\ge 90$ on Mobile           | Mobile throttling profile (Slow 4G / mid-tier mobile processor).                     |
| **KPI-A11Y-04**   | **Morning Attendance Task Time**      | $\le 90\text{ seconds}$      | Median time required for a teacher to record and submit a 30-student section roster. |
| **KPI-A11Y-05**   | **Shared-Device Session Clearance**   | $100\%$ Success              | All sensitive client state, cached tokens, and DOM data cleared upon user logout.    |
