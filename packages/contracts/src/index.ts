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
