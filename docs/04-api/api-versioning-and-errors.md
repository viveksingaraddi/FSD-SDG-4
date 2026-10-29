# API Versioning and Error Handling Specifications

This document defines the API versioning strategy, deprecation lifecycle, and standardized error response specifications for the **FSD-SDG-4 Quality Education SaaS** REST API.

---

## 1. Versioning and Deprecation Strategy

### 1.1 URI Path Versioning
The platform employs **explicit URI path versioning**:
- Base path: `/api/v1`
- Any future breaking changes that cannot be achieved via additive, backward-compatible fields will be introduced under a new version namespace (e.g., `/api/v2`).
- Additive changes (adding optional request fields, returning new response attributes) are considered backward compatible and do not bump the major version.

### 1.2 Deprecation Lifecycle
If an endpoint or version must be deprecated:
1. **Sunset Header**: The API emits standard IETF headers:  
   `Deprecation: true`  
   `Sunset: Wed, 29 Apr 2027 00:00:00 GMT`
2. **Grace Period**: Deprecated endpoints must remain operational for a minimum of **6 months** following public deprecation announcement.

---

## 2. Standardized RFC 7807 / RFC 9457 Error Specification

All HTTP error responses ($4xx$ and $5xx$) must strictly adhere to the `application/problem+json` format:

### Error Envelope Schema
```json
{
  "type": "string (URI referencing the error category)",
  "title": "string (Short, human-readable summary of problem)",
  "status": "integer (HTTP status code)",
  "detail": "string (Specific human-readable explanation for this occurrence)",
  "instance": "string (URI path of the requested resource)",
  "code": "string (Stable machine-readable error code)",
  "invalidParams": [
    {
      "name": "string (Field path that failed validation)",
      "reason": "string (Specific constraint violation rule)"
    }
  ],
  "correlationId": "string (UUID for log tracing)",
  "timestamp": "string (ISO 8601 UTC timestamp)"
}
```

---

## 3. Standard Error Code Registry

| Error Code | HTTP Status | Title | Description |
| :--- | :---: | :--- | :--- |
| `ERR_AUTH_CREDENTIALS_INVALID` | 401 | Invalid Credentials | Password or email does not match. |
| `ERR_AUTH_SESSION_EXPIRED` | 401 | Session Expired | Session token has expired; user must re-authenticate. |
| `ERR_FORBIDDEN_ROLE` | 403 | Insufficient Permissions | User role lacks required permission for this resource. |
| `ERR_TENANT_ISOLATION_VIOLATION` | 403 | Cross-Tenant Prohibited | Attempt to access resources outside user's school tenant. |
| `ERR_RESOURCE_NOT_FOUND` | 404 | Resource Not Found | Target entity ID does not exist in the tenant. |
| `ERR_STATE_CONFLICT` | 409 | State Conflict | Entity state conflicts with action (e.g. duplicate attendance). |
| `ERR_VALIDATION_FAILED` | 422 | Unprocessable Entity | Payload failed Zod schema validation rules. |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | Too Many Requests | Client exceeded request rate limit threshold. |
| `ERR_INTERNAL_SERVER_ERROR` | 500 | Internal Server Error | Unhandled server exception (correlation ID logged). |
