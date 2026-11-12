/**
 * @fsd-sdg4/contracts
 *
 * Owns the canonical API contract surface for /api/v1.
 * Re-exports shared types and defines route path constants.
 *
 * Import boundary: Safe for both browser (apps/web) and server (apps/api).
 * MUST NOT import backend-only packages.
 */

export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiMeta,
  FieldError,
  HealthCheckResponse,
  ReadinessCheckResponse,
  ReadinessCheck,
  UserRole,
  AttendanceStatus,
  SupportPlanStatus,
  SupportFlagStatus,
  SupportTier,
  EnrollmentStatus,
} from '@fsd-sdg4/shared-types';

// ─── API Route Path Constants ──────────────────────────────────────────────

/**
 * Canonical /api/v1 route paths.
 * Both frontend API client and backend Express router MUST derive paths from here.
 * Never hardcode paths in feature components or route handlers.
 */
export const API_ROUTES = {
  HEALTH: '/health',
  READY: '/api/v1/ready',
  // Authentication (Phase 7)
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  // School admin (Phase 8)
  SCHOOL: {
    ACADEMIC_YEARS: '/api/v1/school/academic-years',
    CLASSES: '/api/v1/school/classes',
    SUBJECTS: '/api/v1/school/subjects',
    OFFERINGS: '/api/v1/school/offerings',
    STAFF: '/api/v1/school/staff',
    STUDENTS: '/api/v1/school/students',
  },
  // Teacher (Phase 10–12)
  TEACHER: {
    ATTENDANCE: '/api/v1/teacher/attendance',
    ASSIGNMENTS: '/api/v1/teacher/assignments',
    GRADES: '/api/v1/teacher/grades',
    SUPPORT_FLAGS: '/api/v1/teacher/support/flags',
    SUPPORT_PLANS: '/api/v1/teacher/support/plans',
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;
