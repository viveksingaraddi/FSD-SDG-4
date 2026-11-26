import {
  ANNOUNCEMENTS_DATA,
  ASSESSMENTS_DATA,
  ASSIGNMENTS_DATA,
  ATTENDANCE_DATA,
  COURSES_DATA,
  INITIAL_PREFERENCES,
  INITIAL_SUPPORT_TICKETS,
  NOTIFICATIONS_DATA,
  PROGRESS_DATA,
  RESOURCES_DATA,
  STUDENT_PROFILE_DATA,
  SUPPORT_FAQS_DATA,
  TEACHERS_DATA,
  TIMETABLE_DATA,
} from '../data/studentMockData.js';
import type {
  AcademicProgressData,
  Announcement,
  Assessment,
  Assignment,
  AssignmentStatus,
  AttendanceSummary,
  Course,
  LearningResource,
  NotificationItem,
  StudentDashboardData,
  StudentPreferences,
  StudentProfile,
  SupportFaq,
  SupportTicket,
  TeacherInfo,
  TimetableSlot,
} from '../types/student.types.js';

interface StudentPortalState {
  profile: StudentProfile;
  courses: Course[];
  assignments: Assignment[];
  assessments: Assessment[];
  resources: LearningResource[];
  attendance: AttendanceSummary;
  progress: AcademicProgressData;
  announcements: Announcement[];
  timetable: TimetableSlot[];
  notifications: NotificationItem[];
  faqs: SupportFaq[];
  tickets: SupportTicket[];
  preferences: StudentPreferences;
  teachers: TeacherInfo[];
}

function cloneInitialState(): StudentPortalState {
  return structuredClone({
    profile: STUDENT_PROFILE_DATA,
    courses: COURSES_DATA,
    assignments: ASSIGNMENTS_DATA,
    assessments: ASSESSMENTS_DATA,
    resources: RESOURCES_DATA,
    attendance: ATTENDANCE_DATA,
    progress: PROGRESS_DATA,
    announcements: ANNOUNCEMENTS_DATA,
    timetable: TIMETABLE_DATA,
    notifications: NOTIFICATIONS_DATA,
    faqs: SUPPORT_FAQS_DATA,
    tickets: INITIAL_SUPPORT_TICKETS,
    preferences: INITIAL_PREFERENCES,
    teachers: TEACHERS_DATA,
  });
}

let state: StudentPortalState = cloneInitialState();

/** Resets mock store state — useful in automated tests. */
export function resetStudentMockState(): void {
  state = cloneInitialState();
}

export const studentService = {
  async getDashboardData(): Promise<StudentDashboardData> {
    const pendingAssignments = state.assignments.filter(
      (a) => a.status === 'NOT_STARTED' || a.status === 'IN_PROGRESS',
    );
    const upcomingAssessments = state.assessments.filter((a) => a.status === 'UPCOMING');
    const todaySlots = state.timetable.filter((slot) => slot.day === 'Thursday');
    const nextAssignment = pendingAssignments[0];
    const nextAssessment = upcomingAssessments[0];

    return {
      profile: { ...state.profile },
      enrolledCoursesCount: state.courses.length,
      pendingAssignmentsCount: pendingAssignments.length,
      nextAssignmentHint: nextAssignment ? nextAssignment.dueLabel : 'All coursework submitted',
      upcomingAssessmentsCount: upcomingAssessments.length,
      nextAssessmentHint: nextAssessment
        ? `Next: ${nextAssessment.subjectName} ${nextAssessment.type}`
        : 'No upcoming assessments',
      attendancePercentage: state.attendance.overallPercentage,
      attendanceSummaryHint: `${state.attendance.presentDays} of ${state.attendance.totalSchoolDays} school days present`,
      todaySlots: [...todaySlots],
      upcomingAssignments: pendingAssignments.slice(0, 4),
      recentAnnouncements: state.announcements.slice(0, 3),
      continueLearningCourses: state.courses.slice(0, 3),
      recentFeedback: state.progress.teacherFeedback.slice(0, 3),
      weeklyActivity: [...state.progress.weeklyActivity],
    };
  },

  async getProfile(): Promise<StudentProfile> {
    return { ...state.profile };
  },

  async updateProfile(patch: Pick<StudentProfile, 'studyFocus' | 'bio'>): Promise<StudentProfile> {
    state.profile = { ...state.profile, ...patch };
    return { ...state.profile };
  },

  async getCourses(): Promise<Course[]> {
    return state.courses.map((course) => ({ ...course }));
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    const found = state.courses.find((course) => course.id === courseId);
    return found ? structuredClone(found) : null;
  },

  async toggleLessonCompletion(courseId: string, lessonId: string): Promise<Course> {
    const courseIdx = state.courses.findIndex((c) => c.id === courseId);
    if (courseIdx === -1) {
      throw new Error('Course not found');
    }

    const course = structuredClone(state.courses[courseIdx]!);
    let toggledLessonFound = false;

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) {
          lesson.completed = !lesson.completed;
          toggledLessonFound = true;
        }
      }
    }

    if (!toggledLessonFound) {
      throw new Error('Lesson not found');
    }

    const allLessons = course.modules.flatMap((m) => m.lessons);
    const completedModuleLessons = allLessons.filter((l) => l.completed).length;
    const baseCompleted = Math.max(0, course.totalLessons - allLessons.length);
    course.completedLessons = Math.min(course.totalLessons, baseCompleted + completedModuleLessons);
    course.progressPercent = Math.round((course.completedLessons / course.totalLessons) * 100);
    const nextIncomplete = allLessons.find((l) => !l.completed);
    course.nextLessonTitle = nextIncomplete ? nextIncomplete.title : 'All unit lessons completed';

    state.courses[courseIdx] = course;
    return structuredClone(course);
  },

  async getAssignments(): Promise<Assignment[]> {
    return state.assignments.map((item) => structuredClone(item));
  },

  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    const found = state.assignments.find((a) => a.id === assignmentId);
    return found ? structuredClone(found) : null;
  },

  async updateAssignmentStatus(
    assignmentId: string,
    status: AssignmentStatus,
  ): Promise<Assignment> {
    const idx = state.assignments.findIndex((a) => a.id === assignmentId);
    if (idx === -1) {
      throw new Error('Assignment not found');
    }
    const updated: Assignment = { ...state.assignments[idx]!, status };
    state.assignments[idx] = updated;
    return structuredClone(updated);
  },

  async submitAssignment(
    assignmentId: string,
    payload: {
      responseText: string;
      fileName?: string | undefined;
      fileSizeLabel?: string | undefined;
    },
  ): Promise<Assignment> {
    const idx = state.assignments.findIndex((a) => a.id === assignmentId);
    if (idx === -1) {
      throw new Error('Assignment not found');
    }

    const existing = state.assignments[idx]!;
    const updated: Assignment = {
      ...existing,
      status: 'SUBMITTED',
      dueLabel: 'Submitted · Nov 26, 2026',
      submission: {
        submittedAt: '2026-11-26 · 12:25 PM',
        responseText: payload.responseText,
        fileName: payload.fileName,
        fileSizeLabel: payload.fileSizeLabel,
        onTime: true,
      },
    };
    state.assignments[idx] = updated;
    return structuredClone(updated);
  },

  async getAssessments(): Promise<Assessment[]> {
    return state.assessments.map((item) => structuredClone(item));
  },

  async getResources(): Promise<LearningResource[]> {
    return state.resources.map((item) => structuredClone(item));
  },

  async toggleSaveResource(resourceId: string): Promise<LearningResource> {
    const idx = state.resources.findIndex((r) => r.id === resourceId);
    if (idx === -1) {
      throw new Error('Resource not found');
    }
    const updated: LearningResource = {
      ...state.resources[idx]!,
      saved: !state.resources[idx]!.saved,
    };
    state.resources[idx] = updated;
    return structuredClone(updated);
  },

  async markResourceAccessed(resourceId: string): Promise<LearningResource> {
    const idx = state.resources.findIndex((r) => r.id === resourceId);
    if (idx === -1) {
      throw new Error('Resource not found');
    }
    const updated: LearningResource = {
      ...state.resources[idx]!,
      recentlyAccessedAt: '2026-11-26 · Just now',
    };
    state.resources[idx] = updated;
    return structuredClone(updated);
  },

  async getAttendance(): Promise<AttendanceSummary> {
    return structuredClone(state.attendance);
  },

  async getProgress(): Promise<AcademicProgressData> {
    return structuredClone(state.progress);
  },

  async getAnnouncements(): Promise<Announcement[]> {
    return state.announcements.map((a) => structuredClone(a));
  },

  async toggleAnnouncementRead(announcementId: string, isRead?: boolean): Promise<Announcement> {
    const idx = state.announcements.findIndex((a) => a.id === announcementId);
    if (idx === -1) {
      throw new Error('Announcement not found');
    }
    const current = state.announcements[idx]!;
    const updated: Announcement = {
      ...current,
      isRead: isRead ?? !current.isRead,
    };
    state.announcements[idx] = updated;
    return structuredClone(updated);
  },

  async markAllAnnouncementsRead(): Promise<Announcement[]> {
    state.announcements = state.announcements.map((a) => ({ ...a, isRead: true }));
    return state.announcements.map((a) => structuredClone(a));
  },

  async getTimetable(): Promise<TimetableSlot[]> {
    return state.timetable.map((slot) => structuredClone(slot));
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return state.notifications.map((n) => structuredClone(n));
  },

  async markNotificationRead(id: string): Promise<NotificationItem[]> {
    state.notifications = state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    return state.notifications.map((n) => structuredClone(n));
  },

  async markAllNotificationsRead(): Promise<NotificationItem[]> {
    state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
    return state.notifications.map((n) => structuredClone(n));
  },

  async getSupportData(): Promise<{
    faqs: SupportFaq[];
    teachers: TeacherInfo[];
    tickets: SupportTicket[];
  }> {
    return {
      faqs: structuredClone(state.faqs),
      teachers: structuredClone(state.teachers),
      tickets: structuredClone(state.tickets),
    };
  },

  async submitTeacherMessage(payload: {
    teacherId: string;
    subject: string;
    message: string;
  }): Promise<SupportTicket> {
    const teacher = state.teachers.find((t) => t.id === payload.teacherId);
    const ticket: SupportTicket = {
      id: `TKT-2026-${105 + state.tickets.length}`,
      type: 'TEACHER_MESSAGE',
      subject: payload.subject,
      recipientOrCategory: teacher ? teacher.name : 'Assigned Teacher',
      createdAt: '2026-11-26 · Just now',
      status: 'Sent',
    };
    state.tickets = [ticket, ...state.tickets];
    return structuredClone(ticket);
  },

  async submitIssueReport(payload: {
    category: string;
    summary: string;
    details: string;
  }): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: `SUP-2026-${201 + state.tickets.length}`,
      type: 'TECH_ISSUE',
      subject: payload.summary,
      recipientOrCategory: payload.category,
      createdAt: '2026-11-26 · Just now',
      status: 'Open',
    };
    state.tickets = [ticket, ...state.tickets];
    return structuredClone(ticket);
  },

  async getPreferences(): Promise<StudentPreferences> {
    return { ...state.preferences };
  },

  async updatePreferences(patch: Partial<StudentPreferences>): Promise<StudentPreferences> {
    state.preferences = { ...state.preferences, ...patch };
    return { ...state.preferences };
  },

  async searchGlobal(query: string): Promise<
    Array<{
      id: string;
      title: string;
      subtitle: string;
      kind: 'Course' | 'Assignment' | 'Resource' | 'Announcement';
      to: string;
    }>
  > {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      kind: 'Course' | 'Assignment' | 'Resource' | 'Announcement';
      to: string;
    }> = [];

    for (const c of state.courses) {
      if (
        c.subjectName.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        c.teacher.name.toLowerCase().includes(term)
      ) {
        results.push({
          id: c.id,
          title: c.subjectName,
          subtitle: `${c.code} · ${c.teacher.name}`,
          kind: 'Course',
          to: `/student/courses/${c.id}`,
        });
      }
    }

    for (const a of state.assignments) {
      if (a.title.toLowerCase().includes(term) || a.subjectName.toLowerCase().includes(term)) {
        results.push({
          id: a.id,
          title: a.title,
          subtitle: `${a.subjectName} · ${a.dueLabel}`,
          kind: 'Assignment',
          to: `/student/assignments/${a.id}`,
        });
      }
    }

    for (const r of state.resources) {
      if (
        r.title.toLowerCase().includes(term) ||
        r.subjectName.toLowerCase().includes(term) ||
        r.topic.toLowerCase().includes(term)
      ) {
        results.push({
          id: r.id,
          title: r.title,
          subtitle: `${r.subjectName} · ${r.format}`,
          kind: 'Resource',
          to: `/student/resources?search=${encodeURIComponent(r.title)}`,
        });
      }
    }

    for (const ann of state.announcements) {
      if (ann.title.toLowerCase().includes(term) || ann.summary.toLowerCase().includes(term)) {
        results.push({
          id: ann.id,
          title: ann.title,
          subtitle: `${ann.authorName} · ${ann.publishedAt}`,
          kind: 'Announcement',
          to: `/student/announcements?notice=${encodeURIComponent(ann.id)}`,
        });
      }
    }

    return results.slice(0, 8);
  },
};
