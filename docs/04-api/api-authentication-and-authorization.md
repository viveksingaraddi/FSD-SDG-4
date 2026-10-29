# API Authentication and Authorization Protocols

This document defines the protocols, cookie transport mechanisms, CSRF defenses, and authorization middleware pipelines governing client communication with the **FSD-SDG-4 Quality Education SaaS** API.

---

## 1. Client Credential Transport

- **Session Cookie (`sid`)**: Authenticated clients authenticate by delivering the `sid` cookie established during `POST /api/v1/auth/login`.
- **Fetch & Axios Settings**: Client requests must set `credentials: 'include'` (or `withCredentials: true` in Axios) on all HTTP requests to ensure session cookies are attached across origins.
- **Forbidden Bearer Tokens**: Client-side storage of bearer tokens in JavaScript accessible stores (`localStorage`, `sessionStorage`) is strictly prohibited.

---

## 2. Cross-Site Request Forgery (CSRF) Defenses

Because session authentication relies on automatic cookie submission by the browser, the platform implements a dual-layer CSRF defense:

1. **`SameSite=Lax` Cookie Policy**: Restricts browser submission of the session cookie during cross-site requests (e.g., third-party links or embedded malicious iframes).
2. **Custom Header Assertion**: All state-changing operations (`POST`, `PUT`, `PATCH`, `DELETE`) require the client to supply a custom header:  
   `X-Requested-With: XMLHttpRequest` (or standard `Content-Type: application/json`).  
   Standard browser HTML form submissions (`<form method="POST">`) cannot set custom HTTP headers without triggering a CORS preflight request, effectively neutralizing classic cross-origin form attacks.

---

## 3. Express Controller Middleware Authorization Pipeline

In the backend codebase, route authorization is declared declaratively via composable middleware:

```typescript
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireRole } from '@/middleware/requireRole';
import { validateRequest } from '@/middleware/validateRequest';
import { SubmitAttendanceSchema } from './attendance.schemas';
import { AttendanceController } from './attendance.controller';

const router = Router();

router.post(
  '/sections/:sectionId',
  authenticate,                            // 1. Validates session cookie & extracts tenant context
  requireRole(['TEACHER', 'SCHOOL_ADMIN']), // 2. Asserts user holds teacher or admin role
  validateRequest(SubmitAttendanceSchema),  // 3. Validates Zod schema
  AttendanceController.submitSectionAttendance
);

export default router;
```

If `authenticate` fails, it halts execution immediately and emits an RFC 7807 `401 Unauthorized` envelope. If `requireRole` fails, it returns `403 Forbidden`.
