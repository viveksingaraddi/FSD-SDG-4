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
  V1_HEALTH: '/api/v1/health',
  READY: '/api/v1/ready',
  OPENAPI: '/api/v1/openapi.json',
  // Authentication (Phase 7 & 10)
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    SESSIONS: '/api/v1/auth/sessions',
    INVITATIONS_VERIFY: '/api/v1/auth/invitations/verify',
    INVITATIONS_ACCEPT: '/api/v1/auth/invitations/accept',
  },
  // Super Admin (Phase 10)
  SUPER_ADMIN: {
    OVERVIEW: '/api/v1/super-admin/overview',
    SCHOOLS: '/api/v1/super-admin/schools',
    AUDIT_LOGS: '/api/v1/super-admin/audit-logs',
    INVITATIONS: '/api/v1/super-admin/invitations',
  },
  // School admin (Phase 10)
  SCHOOL: {
    OVERVIEW: '/api/v1/school/overview',
    ONBOARDING: '/api/v1/school/onboarding',
    ONBOARDING_PROGRESS: '/api/v1/school/onboarding/progress',
    ONBOARDING_COMPLETE: '/api/v1/school/onboarding/complete',
    ACADEMIC_YEARS: '/api/v1/school/academic-years',
    CLASSES: '/api/v1/school/classes',
    SECTIONS: '/api/v1/school/sections',
    SUBJECTS: '/api/v1/school/subjects',
    OFFERINGS: '/api/v1/school/offerings',
    STAFF: '/api/v1/school/staff',
    STUDENTS: '/api/v1/school/students',
    AUDIT_LOGS: '/api/v1/school/audit-logs',
    SETTINGS: '/api/v1/school/settings',
    INVITATIONS: '/api/v1/school/invitations',
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

// ─── Admin Portal DTOs (Phase 10) ───────────────────────────────────────────

export type SchoolStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface SchoolSummaryDto {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  contactEmail: string;
  status: SchoolStatus;
  createdAt: string;
  userCount: number;
  studentCount: number;
}

export interface SchoolDetailDto extends SchoolSummaryDto {
  classCount: number;
  staffCount: number;
  activeAcademicYear: string | null;
  sectionCount?: number;
  recentAuditLogs?: AuditLogDto[];
}

export interface PlatformUserBreakdownDto {
  teachers: number;
  students: number;
  schoolAdmins: number;
  parents: number;
  superAdmins: number;
}

export interface SchoolRegistrationTrendDto {
  period: string;
  count: number;
}

export interface PlatformSchoolBreakdownDto {
  active: number;
  suspended: number;
  archived: number;
  totalClasses: number;
  totalSections: number;
  registrationTrends?: SchoolRegistrationTrendDto[];
}

export interface PlatformAlertDto {
  id: string;
  level: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface PlatformOverviewDto {
  totalSchools: number;
  activeSchools: number;
  suspendedSchools: number;
  archivedSchools?: number;
  totalUsers: number;
  recentAuditEvents: number;
  usersByRole?: PlatformUserBreakdownDto;
  schoolsAnalytics?: PlatformSchoolBreakdownDto;
  alerts?: PlatformAlertDto[];
}

export interface AttendanceTrendItemDto {
  date: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
}

export interface SchoolAttendanceSummaryDto {
  recordedDate: string;
  totalRecorded: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  trend?: AttendanceTrendItemDto[];
}

export interface SchoolRecentAssessmentDto {
  id: string;
  title: string;
  assessmentDate: string;
  subjectName: string;
  className: string;
  maxMarks: number;
  weightPercentage: number;
}

export interface SchoolAcademicSummaryDto {
  activeAssignments: number;
  upcomingAssessments: number;
  totalAssessments: number;
  recentAssessments: SchoolRecentAssessmentDto[];
}

export interface SchoolRecentStudentDto {
  id: string;
  name: string;
  studentIdNumber: string;
  createdAt: string;
}

export interface SchoolRecentActivityDto {
  recentStudents: SchoolRecentStudentDto[];
  recentAuditLogs: AuditLogDto[];
}

export interface SchoolAlertDto {
  id: string;
  type: 'WARNING' | 'INFO' | 'ACTION_REQUIRED';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SchoolOverviewDto {
  schoolName: string;
  activeAcademicYear: string | null;
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  totalSections: number;
  activeSupportPlans: number;
  attendance?: SchoolAttendanceSummaryDto;
  academic?: SchoolAcademicSummaryDto;
  activity?: SchoolRecentActivityDto;
  alerts?: SchoolAlertDto[];
}

export interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  sectionCount?: number;
}

export interface SectionDto {
  id: string;
  name: string;
  capacity: number | null;
  roomNumber: string | null;
  academicYearId: string;
  academicYearName: string;
  classId?: string;
  className?: string;
  studentCount?: number;
}

export interface ClassDto {
  id: string;
  name: string;
  stage: string;
  sortOrder: number;
  sections: SectionDto[];
  studentCount?: number;
}

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: string | null;
  offeringCount?: number;
}

export interface OfferingTeacherDto {
  allocationId: string;
  teacherId: string;
  teacherName: string;
  employeeId: string;
  role: 'PRIMARY' | 'ASSISTANT';
}

export interface CourseOfferingDto {
  id: string;
  academicYearId: string;
  academicYearName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  syllabus: string | null;
  teachers: OfferingTeacherDto[];
}

export interface StaffMemberDto {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  allocationCount?: number;
}

export interface TeacherAllocationDto {
  id: string;
  courseOfferingId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  role: 'PRIMARY' | 'ASSISTANT';
  assignedAt: string;
}

export interface TeacherDetailDto {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
  allocations: TeacherAllocationDto[];
  recentAuditLogs?: AuditLogDto[];
}

export interface StudentDirectoryDto {
  id: string;
  userId: string;
  studentIdNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  admissionDate: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  currentSection: string | null;
  currentSectionId?: string | null;
  currentClassId?: string | null;
  currentClassName?: string | null;
}

export interface StudentEnrollmentHistoryDto {
  id: string;
  sectionId: string;
  sectionName: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  status: 'ACTIVE' | 'WITHDRAWN' | 'COMPLETED';
  enrolledAt: string;
}

export interface StudentGuardianDto {
  id: string;
  guardianUserId: string;
  name: string;
  email: string;
  relationshipType: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER';
  isPrimaryContact: boolean;
  isVerified: boolean;
}

export interface StudentDetailDto {
  id: string;
  userId: string;
  studentIdNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  admissionDate: string;
  dateOfBirth: string | null;
  gender: string | null;
  currentSectionId: string | null;
  currentSectionName: string | null;
  currentClassId: string | null;
  currentClassName: string | null;
  academicYearName: string | null;
  enrollmentHistory: StudentEnrollmentHistoryDto[];
  guardians: StudentGuardianDto[];
  recentAuditLogs?: AuditLogDto[];
}

export interface AuditLogDto {
  id: string;
  schoolId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface SchoolSettingsDto {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  contactEmail: string;
  status: SchoolStatus;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface UserInvitationDto {
  id: string;
  schoolId: string | null;
  schoolName?: string | null;
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  status: InvitationStatus;
  deliveryStatus?: DeliveryStatus;
  deliveryAttempts?: number;
  deliveredAt?: string | null;
  deliveryError?: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitationUrl?: string;
}

export interface InvitationVerificationDto {
  valid: boolean;
  email?: string;
  role?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  schoolName?: string | null;
  reason?: 'EXPIRED' | 'REVOKED' | 'ACCEPTED' | 'NOT_FOUND' | 'INVALID';
}

export interface ProvisionSchoolResultDto extends SchoolSummaryDto {
  adminEmail?: string | undefined;
  invitationUrl?: string | undefined;
  invitationId?: string | undefined;
}

export type OnboardingStepKey =
  | 'profile'
  | 'academic-year'
  | 'classes-sections'
  | 'subjects'
  | 'teachers'
  | 'students'
  | 'parents'
  | 'summary';

export interface SchoolOnboardingStatusDto {
  schoolId: string;
  schoolName: string;
  isComplete: boolean;
  completionPercentage: number;
  currentStep: OnboardingStepKey;
  completedSteps: OnboardingStepKey[];
  pendingSteps: OnboardingStepKey[];
  steps: {
    profile: {
      isComplete: boolean;
      name: string;
      code: string;
      subdomain: string;
      contactEmail: string;
      status: string;
    };
    academicYear: {
      isComplete: boolean;
      count: number;
      activeYear: AcademicYearDto | null;
    };
    classesSections: {
      isComplete: boolean;
      classCount: number;
      sectionCount: number;
    };
    subjects: {
      isComplete: boolean;
      count: number;
    };
    teachers: {
      isComplete: boolean;
      count: number;
      invitedCount: number;
    };
    students: {
      isComplete: boolean;
      count: number;
    };
    parents: {
      isComplete: boolean;
      count: number;
      invitedCount: number;
    };
  };
  summary: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    hasActiveYear: boolean;
  };
  lastSavedAt: string | null;
}

export interface SaveOnboardingProgressResultDto {
  success: boolean;
  savedStep: OnboardingStepKey;
  savedAt: string;
}

export interface CompleteOnboardingResultDto {
  success: boolean;
  completedAt: string;
}
