# Pull Request Report: Academic Management Module

## 1. PR Overview

- **PR Title**: `feat(admin): implement academic management module`
- **Source Branch**: `feature/admin-portal`
- **Target Branch**: `develop`
- **Module**: Academic Management (Academic Years, Classes, Sections, Curriculum Subjects, Course Offerings, and Teacher Allocations)
- **Status**: READY FOR PULL REQUEST

---

## 2. Implementation Summary

This pull request completes the full full-stack implementation of the **Academic Management Module** within the School Administrator Portal.

### Academic Year Management

- **Lifecycle & Boundaries**: Supports listing, creation, and updating of institutional academic years with start and end dates.
- **Date Range Validation**: Enforces `endDate > startDate` at both the Zod validation layer and service layer with 400 Bad Request error feedback.
- **Single Active Term Guarantee**: When an academic year is marked `ACTIVE` (or transitioned via `activateAcademicYear`), all other academic years for the tenant are transitioned to `ARCHIVED` in a strict PostgreSQL transaction.
- **Section Accounting**: Aggregates live section counts anchored to each term.

### Class Management

- **Hierarchy & Grade Levels**: Supports listing, creation, updating, and deletion of classes (`name`, `stage`, `sortOrder`).
- **Uniqueness**: Enforces unique class names per school tenant (`@@unique([schoolId, name])`).
- **Cascade Protection**: Prevents deletion of any class containing active sections with a 409 Conflict error.
- **Live Statistics**: Computes enrolled student counts and section tallies in real-time.

### Section Management

- **Class & Year Association**: Sections link directly to an academic year and class (`classId`, `academicYearId`, `name`, `capacity`, `roomNumber`).
- **Uniqueness Constraint**: Prevents duplicate section names within the same class and term (`@@unique([schoolId, academicYearId, classId, name])`).
- **Capacity & Enrolled Accounting**: Displays current enrolled students against room capacity.
- **Deletion Safeguard**: Prevents deletion of sections with active student enrollments, course offerings, or attendance records.

### Curriculum Subject Management

- **Curriculum Catalog**: Supports subject listing, creation, updating, and deletion (`code`, `name`, `description`, `credits`).
- **School-Scoped Codes**: Enforces unique subject codes per school (`@@unique([schoolId, code])`).
- **Dependency Guard**: Prevents deletion of subjects actively assigned to course offerings.

### Course Offerings & Teacher Allocation

- **Curriculum Offerings (`CourseOffering`)**: Links an academic year, section, and subject with optional syllabus.
- **Faculty Allocation (`CourseTeacher`)**: Enables assigning multiple teachers per offering with role distinction (`PRIMARY` vs `ASSISTANT`).
- **Conflict Prevention**: Rejects duplicate course offerings (`@@unique([schoolId, academicYearId, sectionId, subjectId])`) and duplicate teacher assignments.
- **Clean Deallocation**: Safe teacher removal preserving historical grades, assessments, and attendance records.

### Zero-Trust Tenant Isolation

- **Contextual Derivation**: All academic routes resolve `schoolId` strictly from the verified session context (`resolveTenantSchoolId(req)`). Client-supplied `schoolId` parameters are never trusted.
- **RBAC**: Restricted to `SCHOOL_ADMIN` with permissions `PERMISSIONS.SCHOOL_CLASSES_READ` and `PERMISSIONS.SCHOOL_CLASSES_MANAGE`.
- **CSRF Protection**: All mutating methods (`POST`, `PATCH`, `DELETE`) require the `X-Requested-With: XMLHttpRequest` header.
- **Audit Logging**: Emits immutable audit logs: `SCHOOL_ACADEMIC_YEAR_CREATED`, `SCHOOL_ACADEMIC_YEAR_UPDATED`, `SCHOOL_ACADEMIC_YEAR_ACTIVATED`, `SCHOOL_CLASS_CREATED`, `SCHOOL_CLASS_UPDATED`, `SCHOOL_CLASS_DELETED`, `SCHOOL_SECTION_CREATED`, `SCHOOL_SECTION_UPDATED`, `SCHOOL_SECTION_DELETED`, `SCHOOL_SUBJECT_CREATED`, `SCHOOL_SUBJECT_UPDATED`, `SCHOOL_SUBJECT_DELETED`, `SCHOOL_OFFERING_CREATED`, `SCHOOL_OFFERING_DELETED`, `SCHOOL_TEACHER_ALLOCATED`, `SCHOOL_TEACHER_DEALLOCATED`.

---

## 3. Changed Files

| File                                                           | Change Description                                                                                                                                                                                                                                                                                               |
| :------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/validation/src/index.ts`                             | Added `updateAcademicYearSchema`, `updateClassSchema`, `updateSectionSchema`, `updateSubjectSchema`, `createOfferingSchema`, `offeringFilterQuerySchema`, `assignOfferingTeacherSchema`. Exported corresponding TypeScript types.                                                                                |
| `packages/contracts/src/index.ts`                              | Enriched `AcademicYearDto`, `SectionDto`, `ClassDto`, and `SubjectDto`. Defined `OfferingTeacherDto` and `CourseOfferingDto`.                                                                                                                                                                                    |
| `apps/api/src/modules/school-admin/schoolAdmin.service.ts`     | Implemented `updateAcademicYear`, `updateClass`, `deleteClass`, `updateSection`, `deleteSection`, `updateSubject`, `deleteSubject`, `listCourseOfferings`, `createCourseOffering`, `deleteCourseOffering`, `assignOfferingTeacher`, and `removeOfferingTeacher` with transactional validation and audit logging. |
| `apps/api/src/modules/school-admin/schoolAdmin.routes.ts`      | Wired endpoints for academic years, classes, sections, subjects, and course offerings with Zod validation, CSRF headers, and role checks.                                                                                                                                                                        |
| `apps/api/src/modules/school-admin/schoolAdmin.routes.test.ts` | Added integration tests verifying route validation, updates, deletions, offering assignments, deallocations, and tenant isolation.                                                                                                                                                                               |
| `apps/web/src/features/admin/schoolAdminApi.ts`                | Added typed frontend API client methods for all academic CRUD operations and offering allocations.                                                                                                                                                                                                               |
| `apps/web/src/features/admin/AcademicSetupPage.tsx`            | Complete rewrite supporting 4 functional tabs (Academic Years, Classes & Sections, Subjects, Course Allocations) with search/filter, full edit/delete modals, confirm dialogs, and KPI summary cards.                                                                                                            |
| `apps/web/src/features/admin/SchoolAdminPortal.test.tsx`       | Added tab switching, class section rendering, and course allocation tests.                                                                                                                                                                                                                                       |

---

## 4. API Endpoints Reference

| Method   | Path                                               | Required Permission     | Description                                             |
| :------- | :------------------------------------------------- | :---------------------- | :------------------------------------------------------ |
| `GET`    | `/api/v1/school/academic-years`                    | `school:classes:read`   | Lists academic terms for tenant                         |
| `POST`   | `/api/v1/school/academic-years`                    | `school:classes:manage` | Creates academic term (enforces date range)             |
| `PATCH`  | `/api/v1/school/academic-years/:id`                | `school:classes:manage` | Updates academic term details                           |
| `PATCH`  | `/api/v1/school/academic-years/:id/activate`       | `school:classes:manage` | Sets academic term as active (archives others)          |
| `GET`    | `/api/v1/school/classes`                           | `school:classes:read`   | Lists classes with sections and enrolled counts         |
| `POST`   | `/api/v1/school/classes`                           | `school:classes:manage` | Creates class / grade level                             |
| `PATCH`  | `/api/v1/school/classes/:id`                       | `school:classes:manage` | Updates class name, stage, sort order                   |
| `DELETE` | `/api/v1/school/classes/:id`                       | `school:classes:manage` | Deletes empty class (rejects if sections exist)         |
| `POST`   | `/api/v1/school/sections`                          | `school:classes:manage` | Creates section within class & academic year            |
| `PATCH`  | `/api/v1/school/sections/:id`                      | `school:classes:manage` | Updates section name, capacity, room number             |
| `DELETE` | `/api/v1/school/sections/:id`                      | `school:classes:manage` | Deletes section (rejects if enrollments/courses exist)  |
| `GET`    | `/api/v1/school/subjects`                          | `school:classes:read`   | Lists curriculum subjects                               |
| `POST`   | `/api/v1/school/subjects`                          | `school:classes:manage` | Registers new subject                                   |
| `PATCH`  | `/api/v1/school/subjects/:id`                      | `school:classes:manage` | Updates subject name, code, description, credits        |
| `DELETE` | `/api/v1/school/subjects/:id`                      | `school:classes:manage` | Deletes subject (rejects if offerings exist)            |
| `GET`    | `/api/v1/school/offerings`                         | `school:classes:read`   | Lists course offerings with allocated teachers          |
| `POST`   | `/api/v1/school/offerings`                         | `school:classes:manage` | Creates offering linking section & subject              |
| `DELETE` | `/api/v1/school/offerings/:id`                     | `school:classes:manage` | Deletes course offering                                 |
| `POST`   | `/api/v1/school/offerings/:id/teachers`            | `school:classes:manage` | Allocates teacher to offering (`PRIMARY` / `ASSISTANT`) |
| `DELETE` | `/api/v1/school/offerings/:id/teachers/:teacherId` | `school:classes:manage` | Deallocates teacher from offering                       |

---

## 5. Verification Commands and Outputs

### A. TypeScript Typecheck

```bash
pnpm typecheck
```

**Output**:

```text
Scope: 6 of 7 workspace projects
packages/config typecheck: Done in 14ms
packages/shared-types typecheck: Done in 889ms
packages/validation typecheck: Done in 1s
packages/contracts typecheck: Done in 476ms
apps/web typecheck: Done in 5.8s
apps/api typecheck: Done in 6.5s
```

**Result**: PASS (0 type errors)

### B. ESLint

```bash
pnpm lint
```

**Output**:

```text
> eslint .
```

**Result**: PASS (0 warnings, 0 errors)

### C. Prettier Format Check

```bash
pnpm format:check
```

**Output**:

```text
Checking formatting...
All matched files use Prettier code style!
```

**Result**: PASS (100% formatted)

### D. Automated Test Suite

```bash
pnpm test
```

**Output**:

```text
Test Files  21 passed (21)
     Tests  101 passed (101)
  Duration  8.8s
```

**Result**: PASS (101 tests passing, 0 failures)

### E. Production Build

```bash
pnpm build
```

**Output**:

```text
✓ 2274 modules transformed.
dist/index.html                            0.82 kB │ gzip:  0.42 kB
dist/assets/index-igLs2DcJ.css            42.73 kB │ gzip:  9.10 kB
dist/assets/AcademicSetupPage-Hhonz869.js  36.08 kB │ gzip:  7.23 kB
✓ built in 591ms
```

**Result**: PASS (Full production build succeeded)

---

## 6. Acceptance Checklist

- [x] **Academic Year Management**: Listing, creation, date range validation, single active term enforcement, updating, activating: **PASS**
- [x] **Class Management**: Listing, creation, duplicate prevention, editing, safe deletion: **PASS**
- [x] **Section Management**: Creation with class & academic year association, room & capacity tracking, editing, deletion safeguards: **PASS**
- [x] **Subject Management**: Subject creation, duplicate code prevention, description & credits editing, deletion safeguards: **PASS**
- [x] **Course Offerings & Teacher Allocation**: Creation, filtering, faculty allocation (`PRIMARY`/`ASSISTANT`), deallocation, deletion: **PASS**
- [x] **Tenant Isolation**: All database queries scoped to session tenant `schoolId`: **PASS**
- [x] **Security Controls**: CSRF header requirement, Zod request body/query validation, role and permission checks: **PASS**
- [x] **Audit Trail**: Full audit logging for all creation, update, deletion, and allocation actions: **PASS**
- [x] **UI/UX & Accessibility**: 4-tab interface, responsive cards, data tables, modals, confirmation dialogs, WCAG 2.2 AA contrast: **PASS**

---

## 7. Known Limitations & Next Steps

- Examination timetable generation and physical classroom conflict scheduling are deferred to subsequent scheduling modules per project charter non-goals.
- Next Task: Task 8 (Student Attendance & Roster Management).
