/**
 * @fsd-sdg4/shared-types
 *
 * Domain-agnostic TypeScript type definitions shared across frontend and backend.
 * This package contains NO runtime code — types only.
 * No secrets, no environment-specific values, no backend-only implementation details.
 *
 * Import boundary: Safe for both browser (apps/web) and server (apps/api).
 */

// ─── Platform Identity Types ───────────────────────────────────────────────

/** All user roles in the platform. Matches backend RBAC definitions. */
export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

/** Attendance status options for a single student on a single day. */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

/** Support plan lifecycle states — human review required at each transition. */
export type SupportPlanStatus = 'DRAFT' | 'ACTIVE' | 'RESOLVED' | 'CONTINUED' | 'ESCALATED';

/** Support flag triage states. Flags are advisory until a human educator reviews. */
export type SupportFlagStatus = 'PROPOSED' | 'CONFIRMED' | 'DISMISSED';

/** Support tier classifications — Tier 1 (early watch) through Tier 3 (external referral). */
export type SupportTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

/** Student enrollment status. */
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED';

// ─── API Response Envelope Types ──────────────────────────────────────────

/**
 * Standard API success response envelope.
 * All /api/v1 endpoints return this shape for successful operations.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

/** Pagination and request metadata included in list responses. */
export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * RFC 7807 Problem Details — standard error envelope for all API errors.
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
export interface ApiErrorResponse {
  success: false;
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  requestId?: string;
  errors?: FieldError[];
}

/** Field-level validation error (used in 422 Unprocessable Entity responses). */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

// ─── Health Check Types ────────────────────────────────────────────────────

/** Response shape of GET /health */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  environment: string;
}

/** Response shape of GET /api/v1/ready */
export interface ReadinessCheckResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: ReadinessCheck[];
}

/** Individual dependency readiness check. */
export interface ReadinessCheck {
  name: string;
  status: 'pass' | 'fail';
  latencyMs?: number;
  message?: string;
}
