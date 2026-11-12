# API Contract Specification Template

Use this template to document versioned REST API endpoints for `/api/v1`.

---

### `[HTTP_METHOD]` /api/v1/[resource-path]

- **Summary**: [Concise one-sentence description of the endpoint's purpose]
- **Owning Module**: [e.g., `backend/src/modules/attendance`]
- **Authentication**: [Required (Session Cookie: `sid`) | Public]
- **Authorized Roles**: [e.g., `TEACHER`, `SCHOOL_ADMIN`]
- **Rate Limit Tier**: [e.g., Standard (100 req/min) | Strict Auth (5 req/15min)]

---

#### 1. Request Parameters

##### Path Parameters

| Parameter |  Type  | Required? | Description                 |
| :-------- | :----: | :-------: | :-------------------------- |
| `id`      | `UUID` |    Yes    | Target resource identifier. |

##### Query Parameters

| Parameter |   Type    | Required? | Default | Description                            |
| :-------- | :-------: | :-------: | :-----: | :------------------------------------- |
| `page`    | `integer` |    No     |   `1`   | Page number for collection pagination. |
| `limit`   | `integer` |    No     |  `20`   | Max items per page ($\le 100$).        |

---

#### 2. Request Body Schema (Zod Definition)

```typescript
import { z } from 'zod';

export const ExampleRequestSchema = z.object({
  title: z.string().min(3).max(100),
  score: z.number().min(0).max(100).optional(),
});

export type ExampleRequest = z.infer<typeof ExampleRequestSchema>;
```

---

#### 3. Response Envelopes

##### Success Response (`200 OK` / `201 Created`)

```json
{
  "data": {
    "id": "res_01HZY4P98Z",
    "title": "Unit 1 Algebra Worksheet",
    "createdAt": "2026-10-29T08:00:00Z"
  }
}
```

##### Error Response (`422 Unprocessable Entity` / `404 Not Found`)

```json
{
  "type": "https://api.fsd-sdg4.internal/errors/validation-failed",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "The request body failed schema validation.",
  "instance": "/api/v1/resource-path",
  "invalidParams": [
    {
      "name": "title",
      "reason": "String must contain at least 3 character(s)"
    }
  ],
  "correlationId": "c5f884a2-1b1e-450a-9d32-d85c829e2f5b",
  "timestamp": "2026-10-29T08:15:22Z"
}
```
