import type { AttendanceStatus } from '@fsd-sdg4/shared-types';

export interface StudentProfile {
  id: string;
  studentIdNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  schoolName: string;
  schoolCode: string;
  gradeName: string;
  sectionName: string;
  academicYear: string;
  rollNumber: string;
  advisorName: string;
  homeroomRoom: string;
  studyFocus: string;
  bio: string;
}

export interface TeacherInfo {
  id: string;
  name: string;
  email: string;
  department: string;
  officeHours: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: 'Reading' | 'Video' | 'Practice' | 'Lab';
  completed: boolean;
  summary: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  code: string;
  subjectName: string;
  category: 'STEM' | 'Humanities' | 'Languages' | 'Technology';
  teacher: TeacherInfo;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  credits: number;
  currentUnit: string;
  nextLessonTitle: string;
  scheduleSummary: string;
  description: string;
  accentColor: 'blue' | 'indigo' | 'emerald' | 'amber' | 'cyan' | 'slate';
  modules: CourseModule[];
}

export type AssignmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';

export interface AssignmentAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  format: 'PDF' | 'DOCX' | 'CSV' | 'LINK';
}

export interface AssignmentSubmission {
  submittedAt: string;
  responseText: string;
  fileName?: string | undefined;
  fileSizeLabel?: string | undefined;
  onTime: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  subjectName: string;
  teacherName: string;
  title: string;
  summary: string;
  instructions: string[];
  dueDate: string;
  dueLabel: string;
  maxMarks: number;
  status: AssignmentStatus;
  estimatedMinutes: number;
  attachments: AssignmentAttachment[];
  submission?: AssignmentSubmission;
  marksObtained?: number;
  teacherFeedback?: string;
}

export type AssessmentStatus = 'UPCOMING' | 'COMPLETED';
export type AssessmentType = 'Quiz' | 'Unit Test' | 'Mid-Term' | 'Practical' | 'Project Review';

export interface Assessment {
  id: string;
  courseId: string;
  subjectName: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  date: string;
  timeWindow: string;
  durationMinutes: number;
  totalMarks: number;
  roomOrMode: string;
  syllabusTopics: string[];
  scoreObtained?: number;
  percentage?: number;
  teacherFeedback?: string;
}

export type ResourceFormat = 'PDF' | 'Notes' | 'Video' | 'External Link';

export interface LearningResource {
  id: string;
  courseId: string;
  subjectName: string;
  title: string;
  description: string;
  format: ResourceFormat;
  topic: string;
  durationOrSize: string;
  updatedAt: string;
  authorName: string;
  saved: boolean;
  recentlyAccessedAt?: string;
  previewContent: string;
  externalUrl?: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus | 'HOLIDAY';
  subjectName?: string;
  note?: string;
}

export interface SubjectAttendance {
  courseId: string;
  subjectName: string;
  teacherName: string;
  attendedClasses: number;
  totalClasses: number;
  percentage: number;
}

export interface AttendanceSummary {
  overallPercentage: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  totalSchoolDays: number;
  records: AttendanceRecord[];
  subjectBreakdown: SubjectAttendance[];
}

export interface SubjectProgress {
  courseId: string;
  subjectName: string;
  currentScore: number;
  targetScore: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  trend: 'Improving' | 'Steady' | 'Building Momentum';
  strengthNote: string;
}

export interface LearningActivityDay {
  day: string;
  minutesStudied: number;
  tasksCompleted: number;
}

export interface TeacherFeedbackItem {
  id: string;
  subjectName: string;
  teacherName: string;
  date: string;
  context: string;
  comment: string;
  highlightTag: string;
}

export interface GrowthGoal {
  id: string;
  title: string;
  subjectName: string;
  nextStep: string;
  progressPercent: number;
  advisorNote: string;
}

export interface AcademicProgressData {
  overallScore: number;
  assignmentCompletionRate: number;
  weeklyStudyHours: number;
  streakDays: number;
  subjectProgress: SubjectProgress[];
  assessmentPerformance: Array<{
    label: string;
    subject: string;
    scorePercent: number;
  }>;
  weeklyActivity: LearningActivityDay[];
  teacherFeedback: TeacherFeedbackItem[];
  areasOfGrowth: GrowthGoal[];
}

export type AnnouncementCategory = 'SCHOOL' | 'TEACHER' | 'NOTICE';

export interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  authorName: string;
  authorRole: string;
  subjectName?: string;
  publishedAt: string;
  priority: 'Normal' | 'Important';
  isRead: boolean;
  summary: string;
  body: string[];
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  periodLabel: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  courseId?: string;
  teacherName: string;
  classroom: string;
  isCurrent?: boolean;
  isBreak?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  category: 'assignment' | 'announcement' | 'feedback' | 'assessment';
  isRead: boolean;
  linkTo: string;
}

export interface SupportFaq {
  id: string;
  category: 'Academics' | 'Technical' | 'Attendance' | 'Account';
  question: string;
  answer: string;
}

export interface SupportTicket {
  id: string;
  type: 'TEACHER_MESSAGE' | 'TECH_ISSUE';
  subject: string;
  recipientOrCategory: string;
  createdAt: string;
  status: 'Sent' | 'Open';
}

export interface StudentPreferences {
  emailReminders: boolean;
  assignmentAlerts: boolean;
  announcementAlerts: boolean;
  weeklyProgressDigest: boolean;
  compactDensity: boolean;
  defaultTimetableView: 'weekly' | 'daily';
  showStudyTips: boolean;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  enrolledCoursesCount: number;
  pendingAssignmentsCount: number;
  nextAssignmentHint: string;
  upcomingAssessmentsCount: number;
  nextAssessmentHint: string;
  attendancePercentage: number;
  attendanceSummaryHint: string;
  todaySlots: TimetableSlot[];
  upcomingAssignments: Assignment[];
  recentAnnouncements: Announcement[];
  continueLearningCourses: Course[];
  recentFeedback: TeacherFeedbackItem[];
  weeklyActivity: LearningActivityDay[];
}
