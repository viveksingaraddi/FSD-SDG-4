/**
 * @fsd-sdg4/contracts
 *
 * Owns the canonical API contract surface for /api/v1.
 * Re-exports shared types and defines route path constants.
 *
 * Import boundary: Safe for both browser (apps/web) and server (apps/api).
 * MUST NOT import backend-only packages.
 */

import type {
  AttendanceStatus,
} from '@fsd-sdg4/shared-types';

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
    SETTINGS: '/api/v1/super-admin/settings',
    USERS: '/api/v1/super-admin/users',
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
    USERS: '/api/v1/school/users',
    GUARDIAN_LINKS: '/api/v1/school/guardian-relationships',
    BULK_IMPORT: {
      PREVIEW: '/api/v1/school/bulk-import/preview',
      EXECUTE: '/api/v1/school/bulk-import/execute',
      JOBS: '/api/v1/school/bulk-import/jobs',
      JOB_DETAIL: '/api/v1/school/bulk-import/jobs/:id',
      JOB_ERRORS: '/api/v1/school/bulk-import/jobs/:id/errors',
      TEMPLATE: '/api/v1/school/bulk-import/template',
    },
  },
  // Teacher (Phase 10–12)
  TEACHER: {
    DASHBOARD: '/api/v1/teacher/dashboard',
    CLASSES: '/api/v1/teacher/classes',
    STUDENTS: '/api/v1/teacher/students',
    ATTENDANCE: '/api/v1/teacher/attendance',
    ASSIGNMENTS: '/api/v1/teacher/assignments',
    GRADES: '/api/v1/teacher/grades',
    ASSESSMENTS: '/api/v1/teacher/assessments',
    TIMETABLE: '/api/v1/teacher/timetable',
    ANNOUNCEMENTS: '/api/v1/teacher/announcements',
    MESSAGES: '/api/v1/teacher/messages',
    PROFILE: '/api/v1/teacher/profile',
    SETTINGS: '/api/v1/teacher/settings',
    SUPPORT_FLAGS: '/api/v1/teacher/support/flags',
    SUPPORT_PLANS: '/api/v1/teacher/support/plans',
  },
  // Parent (Phase 14 / Option A)
  PARENT: {
    OVERVIEW: '/api/v1/parent/overview',
    CHILDREN: '/api/v1/parent/children',
    CHILD_ATTENDANCE: '/api/v1/parent/children/:studentId/attendance',
    ABSENCE_NOTES: '/api/v1/parent/children/:studentId/attendance-notes',
    CHILD_ASSIGNMENTS: '/api/v1/parent/children/:studentId/assignments',
    CHILD_GRADES: '/api/v1/parent/children/:studentId/grades',
    CHILD_SUPPORT_PLANS: '/api/v1/parent/children/:studentId/support-plans',
    SUPPORT_ACTION_UPDATE: '/api/v1/parent/children/:studentId/support-actions/:actionId',
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
  totalStudents?: number;
  totalTeachers?: number;
  registrationTrends?: SchoolRegistrationTrendDto[];
}

export interface PlatformAdoptionMetricsDto {
  schoolsWithActiveYear: number;
  totalStudentsAcrossSchools: number;
  averageStudentsPerSchool: number;
  averageTeachersPerSchool: number;
  invitationAcceptanceRate: number;
}

export interface PlatformOperationalStatsDto {
  totalCourseOfferings: number;
  totalAssignments: number;
  totalAssessments: number;
  invitations: {
    total: number;
    accepted: number;
    pending: number;
    revoked: number;
    expired: number;
  };
}

export interface PlatformSecurityPoliciesDto {
  sessionPolicy: {
    maxAgeSeconds: number;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
    httpOnly: boolean;
  };
  csrfProtection: {
    enabled: boolean;
    headerName: string;
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecial: boolean;
    hashingAlgorithm: string;
  };
  tenantIsolation: {
    model: string;
    zeroTrust: boolean;
    enforcementLayer: string;
  };
  rateLimiting: {
    globalLimit: number;
    authLimit: number;
  };
  emailDelivery: {
    provider: string;
    secureTls: boolean;
  };
}

export interface PlatformSettingsDto {
  policies: PlatformSecurityPoliciesDto;
  version: string;
  environment: string;
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
  adoptionMetrics?: PlatformAdoptionMetricsDto;
  operationalStats?: PlatformOperationalStatsDto;
  alerts?: PlatformAlertDto[];
  period?: 'all' | '30d' | '90d' | 'year';
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
  totalCourseOfferings?: number;
  assignmentsByStatus?: {
    published: number;
    draft: number;
    archived: number;
  };
  recentAssessments: SchoolRecentAssessmentDto[];
}

export interface SchoolPendingTaskDto {
  id: string;
  title: string;
  category: 'ACADEMIC' | 'FACULTY' | 'STUDENT' | 'SECURITY';
  actionUrl: string;
  actionLabel: string;
  count?: number;
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
  invitations?: {
    total: number;
    pending: number;
    accepted: number;
    revoked: number;
  };
  pendingTasks?: SchoolPendingTaskDto[];
  period?: 'all' | '7d' | '30d';
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

export type GuardianRelationshipDto = StudentGuardianDto;

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
  delta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SchoolSettingsDto {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  contactEmail: string;
  status: SchoolStatus;
  activeAcademicYearId?: string | null;
  activeAcademicYearName?: string | null;
  totalAcademicYears?: number;
  preferences?: {
    emailNotificationsEnabled: boolean;
    weeklyAttendanceDigest: boolean;
    studentSupportAlerts: boolean;
  };
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

// ─── User Lifecycle Management DTOs (Task 13) ──────────────────────────────

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface UserDirectoryItemDto {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  status: UserStatus;
  schoolId: string | null;
  schoolName: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  identifier: string | null; // employeeId or studentIdNumber
  lastLoginAt: string | null;
  createdAt: string;
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED' | 'NONE';
  invitationId?: string | null;
  invitationExpiresAt?: string | null;
  invitationDeliveryStatus?: 'PENDING' | 'SENT' | 'FAILED' | null;
}

export interface UserLifecycleDetailDto extends UserDirectoryItemDto {
  updatedAt: string;
  teacherProfile?: {
    id: string;
    employeeId: string;
    specialization: string | null;
    allocationCount: number;
  } | null;
  studentProfile?: {
    id: string;
    studentIdNumber: string;
    admissionDate: string;
    dateOfBirth: string | null;
    gender: string | null;
    currentSection: string | null;
    enrollmentCount: number;
  } | null;
  guardianRelationships?: {
    id: string;
    studentId: string;
    studentName: string;
    studentIdNumber: string;
    relationshipType: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER';
    isPrimaryContact: boolean;
    isVerified: boolean;
  }[];
  studentGuardians?: {
    id: string;
    guardianUserId: string;
    guardianName: string;
    guardianEmail: string;
    relationshipType: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER';
    isPrimaryContact: boolean;
    isVerified: boolean;
  }[];
  recentAuditLogs?: AuditLogDto[];
}

export interface PaginatedUsersResultDto {
  items: UserDirectoryItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Bulk Onboarding & Import DTOs (Task 14) ───────────────────────────────

export type BulkImportCategory = 'STUDENTS' | 'TEACHERS' | 'PARENTS';
export type BulkImportStatus = 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BulkImportRowErrorDto {
  rowNumber: number;
  field?: string | undefined;
  message: string;
  identifier?: string | undefined;
  rawData?: Record<string, string> | undefined;
}

export interface BulkImportRowPreviewDto {
  rowNumber: number;
  isValid: boolean;
  data: Record<string, string>;
  errors: string[];
  warnings?: string[] | undefined;
}

export interface BulkImportPreviewResponseDto {
  category: BulkImportCategory;
  filename: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  columns: string[];
  detectedRows: BulkImportRowPreviewDto[];
  eligibleInvitations: number;
  canProceed: boolean;
}

export interface BulkImportJobDto {
  id: string;
  schoolId: string;
  actorId: string | null;
  actorName?: string | null | undefined;
  category: BulkImportCategory;
  filename: string;
  fileSize: number;
  status: BulkImportStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  invitationsCreated: number;
  invitationsSent: number;
  invitationsFailed: number;
  summary?: Record<string, unknown> | null | undefined;
  errors?: BulkImportRowErrorDto[] | null | undefined;
  idempotencyKey?: string | null | undefined;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BulkImportJobsListResponseDto {
  items: BulkImportJobDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Teacher Portal DTOs ────────────────────────────────────────────────────

export interface TeacherSummaryDto {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string | null;
  schoolName: string;
}

export interface TeacherStatsDto {
  assignedClassesCount: number;
  totalStudentsCount: number;
  attendanceToday: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  };
  pendingAssignmentsCount: number;
  upcomingExaminationsCount: number;
}

export interface TeacherTimetableItemDto {
  id: string;
  courseOfferingId: string;
  className: string;
  sectionName: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
}

export interface TeacherWeeklyAttendanceTrendDto {
  day: string;
  rate: number;
  present: number;
  absent: number;
}

export interface TeacherAttendanceOverviewDto {
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  weeklyTrend: TeacherWeeklyAttendanceTrendDto[];
}

export interface TeacherActivityDto {
  id: string;
  type: 'ATTENDANCE' | 'SUBMISSION' | 'ASSESSMENT' | 'ANNOUNCEMENT';
  title: string;
  description: string;
  timestamp: string;
  badgeVariant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
}

export interface TeacherTaskDto {
  id: string;
  title: string;
  category: 'GRADING' | 'EXAMINATION' | 'ATTENDANCE' | 'CLASS';
  dueDate: string;
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TeacherDashboardDto {
  teacher: TeacherSummaryDto;
  stats: TeacherStatsDto;
  timetableToday: TeacherTimetableItemDto[];
  attendanceOverview: TeacherAttendanceOverviewDto;
  recentActivities: TeacherActivityDto[];
  upcomingTasks: TeacherTaskDto[];
}

export interface TeacherClassSectionDto {
  courseOfferingId: string;
  sectionId: string;
  classId: string;
  className: string;
  sectionName: string;
  academicYearName: string;
  roomNumber: string | null;
  capacity: number | null;
  studentCount: number;
  subjectName: string;
  subjectCode: string;
  isPrimaryTeacher: boolean;
}

export interface TeacherStudentDto {
  id: string;
  studentIdNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  currentSection: string;
  gender: string | null;
  dateOfBirth: string | null;
  admissionDate: string;
  attendanceRate: number;
  parentName?: string | null;
  parentEmail?: string | null;
}

export interface TeacherStudentAttendanceRosterItemDto {
  studentId: string;
  studentIdNumber: string;
  firstName: string;
  lastName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  lateMinutes: number | null;
  remarks: string | null;
}

export interface TeacherAttendanceRosterDto {
  sectionId: string;
  sectionName: string;
  className: string;
  attendanceDate: string;
  students: TeacherStudentAttendanceRosterItemDto[];
}

export interface TeacherAssignmentDto {
  id: string;
  courseOfferingId: string;
  title: string;
  instructions: string;
  maxPoints: number;
  dueDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  className: string;
  sectionName: string;
  subjectName: string;
  subjectCode: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  createdAt: string;
}

export interface TeacherAssessmentDto {
  id: string;
  courseOfferingId: string;
  title: string;
  assessmentDate: string;
  weightPercentage: number;
  maxMarks: number;
  className: string;
  sectionName: string;
  subjectName: string;
  subjectCode: string;
  recordedResultsCount: number;
  totalEnrolledCount: number;
}

export interface TeacherAnnouncementDto {
  id: string;
  title: string;
  content: string;
  authorName: string;
  priority: 'NORMAL' | 'URGENT' | 'INFORMATIONAL';
  publishedAt: string;
  targetAudience: string;
}

export interface TeacherMessageDto {
  id: string;
  senderName: string;
  senderRole: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

// ─── Parent Portal DTOs (Phase 14 / Option A) ────────────────────────────────

export type GuardianRelationshipType = 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER';

export interface ParentChildSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  studentIdNumber: string;
  className: string;
  sectionName: string;
  relationshipType: GuardianRelationshipType;
  isPrimaryContact: boolean;
}

export interface ParentFamilyOverviewChildDto extends ParentChildSummaryDto {
  attendanceRate: number;
  unexcusedAbsenceCount: number;
  activeSupportPlanCount: number;
  recentGradesCount: number;
}

export interface ParentFamilyOverviewDto {
  guardianName: string;
  children: ParentFamilyOverviewChildDto[];
}

export interface ChildAttendanceRecordDto {
  id: string;
  attendanceDate: string;
  status: AttendanceStatus;
  lateMinutes: number | null;
  remarks: string | null;
  amendmentReason: string | null;
}

export interface ChildAttendanceStatsDto {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface ChildAttendanceMonthSummaryDto {
  studentId: string;
  month: string;
  stats: ChildAttendanceStatsDto;
  records: ChildAttendanceRecordDto[];
}

export interface ParentAbsenceNoteResponseDto {
  recorded: boolean;
  message: string;
  attendanceRecordId: string;
}

export interface ChildCourseworkSubmissionDto {
  assignmentId: string;
  title: string;
  dueDate: string;
  score: number | null;
  maxPoints: number;
  status: string;
  submittedAt: string | null;
  feedback: string | null;
  feedbackAuthorName: string | null;
}

export interface ChildAssessmentResultDto {
  assessmentId: string;
  title: string;
  assessmentDate: string;
  score: number;
  maxMarks: number;
  weightPercentage: number;
  gradeLetter: string | null;
  notes: string | null;
  feedback: string | null;
}

export interface ChildSubjectAcademicReportDto {
  courseOfferingId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  assignments: ChildCourseworkSubmissionDto[];
  assessments: ChildAssessmentResultDto[];
}

export interface ChildAcademicReportDto {
  studentId: string;
  studentName: string;
  academicYearName: string;
  subjects: ChildSubjectAcademicReportDto[];
}

export interface ChildSupportActionDto {
  id: string;
  supportPlanId: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt: string | null;
  isHomeAction: boolean;
}

export interface ChildSupportPlanDto {
  id: string;
  problemSummary: string;
  targetGoal: string;
  reviewDate: string;
  status: string;
  leadTeacherName: string;
  actionItems: ChildSupportActionDto[];
}

export interface ParentAssignmentItemDto {
  assignmentId: string;
  title: string;
  instructions: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  maxPoints: number;
  score: number | null;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'OVERDUE';
  submittedAt: string | null;
  feedback: string | null;
}

export interface ChildAssignmentsResponseDto {
  studentId: string;
  studentName: string;
  assignments: ParentAssignmentItemDto[];
}

