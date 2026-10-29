# API Endpoint Contract Template

This document provides the standardized contract template for specifying REST API endpoints in future development phases, accompanied by a representative sample for attendance roster submission.

---

## 1. Standard API Contract Template

```markdown
### [METHOD] /api/v1/resource-path

- **Summary**: Concise explanation of the endpoint's operational purpose.
- **Owning Module**: [e.g., `backend/src/modules/attendance`]
- **Authentication**: Required (Cookie: `sid`)
- **Authorized Roles**: [e.g., `TEACHER`, `SCHOOL_ADMIN`]
- **Tenant Scope**: Strict (derived from session `schoolId`)

#### 1. Request Parameters
- **Path Parameters**:
  - `paramName` (type, required): Description.
- **Query Parameters**:
  - `queryParam` (type, optional, default): Description.

#### 2. Request Body Schema (Zod)
```typescript
export const RequestSchema = z.object({
  // Schema attributes
});
```

#### 3. Success Response (`200 OK` / `201 Created`)
```json
{
  "data": {}
}
```

#### 4. Error Responses
- `401 Unauthorized`: Missing or invalid session cookie (`ERR_AUTH_SESSION_EXPIRED`).
- `403 Forbidden`: Role not authorized (`ERR_FORBIDDEN_ROLE`).
- `404 Not Found`: Target resource not found in caller's school tenant (`ERR_RESOURCE_NOT_FOUND`).
- `422 Unprocessable Entity`: Validation failure on request body (`ERR_VALIDATION_FAILED`).
```

---

## 2. Representative Sample: Bulk Section Attendance Submission

### `POST` /api/v1/attendance/sections/:sectionId

- **Summary**: Records or updates daily attendance for all students enrolled in a class section for a specific calendar date.
- **Owning Module**: `attendance`
- **Authentication**: Required (Session Cookie: `sid`)
- **Authorized Roles**: `TEACHER`, `SCHOOL_ADMIN`
- **Tenant Scope**: Strict (Caller must be assigned to section or admin for tenant).

#### 1. Request Parameters
- **Path Parameters**:
  - `sectionId` (`UUID`, required): Unique identifier of the class section.

#### 2. Request Body Schema (Zod)
```typescript
export const SubmitAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      remarks: z.string().max(255).optional()
    })
  ).min(1, 'At least one student record is required')
});
```

#### 3. Success Response (`200 OK`)
```json
{
  "data": {
    "sectionId": "sec_01HZY4P98Z",
    "date": "2026-10-29",
    "totalSubmitted": 32,
    "presentCount": 29,
    "absentCount": 2,
    "lateCount": 1,
    "excusedCount": 0,
    "submittedAt": "2026-10-29T08:15:22Z"
  }
}
```
