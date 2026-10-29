# API Pagination, Filtering, and Sorting Standards

This document establishes the uniform query parameter conventions and response envelopes for collection querying, pagination, filtering, and sorting across the **FSD-SDG-4 Quality Education SaaS** API.

---

## 1. Standard Pagination Protocol

All endpoints returning list collections must implement **offset/limit pagination** with strict upper bounds:

### 1.1 Query Parameters
- `page`: 1-indexed positive integer specifying the requested page number (Default: `1`).
- `limit`: Number of records to return per page (Default: `20`, Maximum: `100`).

### 1.2 Pagination Response Envelope
```json
{
  "data": [
    { "id": "res_01", "title": "Geometry Notes" },
    { "id": "res_02", "title": "Algebra Practice" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 42,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 2. Filtering Conventions

Filters are passed as explicit camelCase query parameters matching entity fields:

- **Exact Match**: `GET /api/v1/attendance/students/:id?status=ABSENT`
- **Multi-Value Filter**: Comma-delimited strings: `?status=ABSENT,LATE`
- **Date Range Filtering**: Explicit `startDate` and `endDate` parameters formatted in ISO 8601:  
  `GET /api/v1/attendance/students/:id?startDate=2026-10-01&endDate=2026-10-31`
- **Free-Text Search**: Standardized `q` parameter for search queries across indexed text columns:  
  `GET /api/v1/users?q=Amina`

---

## 3. Sorting Conventions

Sorting is controlled via two standardized query parameters:

- `sortBy`: Field name to sort against (must be in the endpoint's allowed sort whitelist, e.g. `createdAt`, `lastName`, `score`).
- `sortOrder`: Sorting direction, strictly either `asc` (ascending) or `desc` (descending). (Default: `asc` for names, `desc` for dates/events).
- Example: `GET /api/v1/support/flags?sortBy=createdAt&sortOrder=desc`
