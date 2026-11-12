# Performance and Load Test Plan

This document establishes the load testing scenarios, performance SLAs, tooling, and execution protocols for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Performance Service Level Objectives (SLOs)

| Profile                               | Metric                 |     SLA Target      | Measurement Protocol                                      |
| :------------------------------------ | :--------------------- | :-----------------: | :-------------------------------------------------------- |
| **Standard Transactional Read/Write** | P95 Response Latency   | $\le 200\text{ ms}$ | 50 Requests Per Second (RPS) sustained for 10 minutes.    |
| **Bulk Attendance Submission**        | Server Processing Time | $\le 250\text{ ms}$ | 35-student roster JSON payload submitted via POST.        |
| **Longitudinal Gradebook Synthesis**  | P95 Query Latency      | $\le 600\text{ ms}$ | Aggregating attendance and assessment grades across term. |
| **Error Rate Under Sustained Load**   | HTTP 5xx Status Rate   |    $\le 0.01\%$     | Under peak concurrent user simulation.                    |

---

## 2. Load Testing Scenarios (Executed via k6)

### Scenario LT-01: Morning Attendance Rush Hour

- **Real-World Context**: At 08:15 AM, 50 teachers across multiple school tenants simultaneously load section rosters and submit attendance within a 15-minute window.
- **Simulation**:
  - 50 virtual users (VUs) ramp up over 2 minutes.
  - Each VU requests `GET /api/v1/attendance/sections/:id?date=today`.
  - Simulates 30-second user think time (marking absences).
  - Posts payload to `POST /api/v1/attendance/sections/:id`.
- **Target Outcome**: Zero request timeouts; P95 latency remains $\le 250\text{ ms}$; database connection pool does not saturate.

### Scenario LT-02: Gradebook Aggregation Stress Test

- **Simulation**: 20 concurrent School Administrators requesting school-wide progress snapshots and gradebook summaries (`GET /api/v1/sections/:id/gradebook`) over 5 minutes.
- **Target Outcome**: P95 response latency $\le 600\text{ ms}$; CPU usage on PostgreSQL instance remains $< 70\%$.

---

## 3. Database Resource Monitoring Protocol

During load tests, Yashwardhan monitors:

1. **Connection Pool Utilization**: Asserts PgBouncer active client connections do not exceed maximum configured pool size ($50$).
2. **Buffer Cache Hit Ratio**: Asserts PostgreSQL buffer cache hit ratio remains $\ge 99\%$, verifying that indexes prevent expensive disk I/O.
3. **Deadlock Rate**: Asserts zero deadlock exceptions during concurrent attendance writes across sections.
