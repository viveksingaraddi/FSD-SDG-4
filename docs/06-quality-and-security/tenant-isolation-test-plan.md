# Tenant Isolation Test Plan

This document establishes the test specification, test cases, and verification criteria for asserting **zero cross-tenant data leakage** within the **FSD-SDG-4 Quality Education SaaS** multi-tenant architecture.

---

## 1. Test Objectives & Pass Criteria

- **Objective**: Guarantee that no authenticated user belonging to School Tenant A can read, modify, delete, or determine the existence of records belonging to School Tenant B.
- **Pass Criteria**:
  - 100% of cross-tenant requests must return HTTP `404 Not Found` (preferred to avoid leaking entity existence) or HTTP `403 Forbidden`.
  - Database state verification must confirm that no records belonging to Tenant B were altered or deleted.
  - Zero cross-tenant data fields appear in response payloads.

---

## 2. Test Environment Setup & Fixtures

The isolation harness provisions two isolated synthetic school tenants:

- **Tenant A (`sch_alpha`)**:
  - Admin: `admin@alpha.test`
  - Teacher: `teacher@alpha.test`
  - Student: `student@alpha.test`
  - Section: `sec_alpha_8A`, Course: `course_alpha_math`, Assignment: `asgn_alpha_1`
- **Tenant B (`sch_beta`)**:
  - Admin: `admin@beta.test`
  - Teacher: `teacher@beta.test`
  - Student: `student@beta.test`
  - Section: `sec_beta_8B`, Course: `course_beta_math`, Assignment: `asgn_beta_1`

---

## 3. Detailed Isolation Test Cases

### TC-ISO-01: Cross-Tenant Attendance Roster Read

- **Actor**: `teacher@alpha.test` (Authenticated in `sch_alpha`)
- **Action**: Executes `GET /api/v1/attendance/sections/sec_beta_8B?date=2026-10-29`
- **Expected Outcome**: HTTP `404 Not Found` (`ERR_RESOURCE_NOT_FOUND`). Response contains zero student names from Section 8B.

### TC-ISO-02: Cross-Tenant Attendance Mutation Attempt

- **Actor**: `teacher@alpha.test`
- **Action**: Executes `POST /api/v1/attendance/sections/sec_beta_8B` with valid payload attempting to mark Beta students `ABSENT`.
- **Expected Outcome**: HTTP `404 Not Found`. Database verification confirms zero records created in `sch_beta`.

### TC-ISO-03: Cross-Tenant Assignment Grade Alteration

- **Actor**: `teacher@alpha.test`
- **Action**: Executes `POST /api/v1/submissions/sub_beta_01/grade` with payload `{ "score": 50 }`.
- **Expected Outcome**: HTTP `404 Not Found`. Database verification confirms student grade in Tenant B remains unaltered.

### TC-ISO-04: Cross-Tenant Support Flag Tampering

- **Actor**: `teacher@alpha.test`
- **Action**: Executes `POST /api/v1/support/flags/flag_beta_01/dismiss` with dismissal note.
- **Expected Outcome**: HTTP `404 Not Found`. Flag in Tenant B remains in `PROPOSED` status.

### TC-ISO-05: Administrative Staff Directory Harvest

- **Actor**: `admin@alpha.test`
- **Action**: Executes `GET /api/v1/users?role=TEACHER` with manipulated header `X-Tenant-Id: sch_beta`.
- **Expected Outcome**: HTTP `200 OK`, but payload contains **strictly Tenant A teachers**. Header override is ignored because tenant context is bound exclusively to the authenticated session.

### TC-ISO-06: Student Cross-Tenant Coursework Access

- **Actor**: `student@alpha.test`
- **Action**: Executes `GET /api/v1/assignments/asgn_beta_1`.
- **Expected Outcome**: HTTP `404 Not Found`. Student cannot access coursework or syllabus of another school.
