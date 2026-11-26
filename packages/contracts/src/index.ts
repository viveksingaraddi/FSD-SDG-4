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
  // Authentication (Phase 7)
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    SESSIONS: '/api/v1/auth/sessions',
  },
  // Super Admin (Phase 10)
  SUPER_ADMIN: {
    OVERVIEW: '/api/v1/super-admin/overview',
    SCHOOLS: '/api/v1/super-admin/schools',
    AUDIT_LOGS: '/api/v1/super-admin/audit-logs',
  },
  // School admin (Phase 10)
  SCHOOL: {
    OVERVIEW: '/api/v1/school/overview',
    ACADEMIC_YEARS: '/api/v1/school/academic-years',
    CLASSES: '/api/v1/school/classes',
    SECTIONS: '/api/v1/school/sections',
    SUBJECTS: '/api/v1/school/subjects',
    OFFERINGS: '/api/v1/school/offerings',
    STAFF: '/api/v1/school/staff',
    STUDENTS: '/api/v1/school/students',
    AUDIT_LOGS: '/api/v1/school/audit-logs',
    SETTINGS: '/api/v1/school/settings',
  },
  // Teacher (Phase 10–12)
  TEACHER: {
    ATTENDANCE: '/api/v1/teacher/attendance',
    ASSIGNMENTS: '/api/v1/teacher/assignments',
    GRADES: '/api/v1/teacher/grades',
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
}

export interface SectionDto {
  id: string;
  name: string;
  capacity: number | null;
  roomNumber: string | null;
  academicYearId: string;
  academicYearName: string;
}

export interface ClassDto {
  id: string;
  name: string;
  stage: string;
  sortOrder: number;
  sections: SectionDto[];
}

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: string | null;
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
  currentSection: string | null;
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

