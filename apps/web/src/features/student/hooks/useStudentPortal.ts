import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/studentService.js';
import type {
  AssignmentStatus,
  StudentPreferences,
  StudentProfile,
} from '../types/student.types.js';

export const STUDENT_QUERY_KEYS = {
  dashboard: ['student', 'dashboard'] as const,
  profile: ['student', 'profile'] as const,
  courses: ['student', 'courses'] as const,
  course: (id: string) => ['student', 'courses', id] as const,
  assignments: ['student', 'assignments'] as const,
  assignment: (id: string) => ['student', 'assignments', id] as const,
  assessments: ['student', 'assessments'] as const,
  resources: ['student', 'resources'] as const,
  attendance: ['student', 'attendance'] as const,
  progress: ['student', 'progress'] as const,
  announcements: ['student', 'announcements'] as const,
  timetable: ['student', 'timetable'] as const,
  notifications: ['student', 'notifications'] as const,
  support: ['student', 'support'] as const,
  preferences: ['student', 'preferences'] as const,
};

export function useStudentDashboard() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.dashboard,
    queryFn: () => studentService.getDashboardData(),
  });
}

export function useStudentProfile() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.profile,
    queryFn: () => studentService.getProfile(),
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Pick<StudentProfile, 'studyFocus' | 'bio'>) =>
      studentService.updateProfile(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.profile });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.dashboard });
    },
  });
}

export function useStudentCourses() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.courses,
    queryFn: () => studentService.getCourses(),
  });
}

export function useStudentCourse(courseId: string) {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.course(courseId),
    queryFn: () => studentService.getCourseById(courseId),
    enabled: Boolean(courseId),
  });
}

export function useToggleLessonCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId }: { courseId: string; lessonId: string }) =>
      studentService.toggleLessonCompletion(courseId, lessonId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: STUDENT_QUERY_KEYS.course(variables.courseId),
      });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.courses });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.dashboard });
    },
  });
}

export function useStudentAssignments() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.assignments,
    queryFn: () => studentService.getAssignments(),
  });
}

export function useStudentAssignment(assignmentId: string) {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.assignment(assignmentId),
    queryFn: () => studentService.getAssignmentById(assignmentId),
    enabled: Boolean(assignmentId),
  });
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, status }: { assignmentId: string; status: AssignmentStatus }) =>
      studentService.updateAssignmentStatus(assignmentId, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.assignments });
      void queryClient.invalidateQueries({
        queryKey: STUDENT_QUERY_KEYS.assignment(variables.assignmentId),
      });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.dashboard });
    },
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      responseText,
      fileName,
      fileSizeLabel,
    }: {
      assignmentId: string;
      responseText: string;
      fileName?: string | undefined;
      fileSizeLabel?: string | undefined;
    }) =>
      studentService.submitAssignment(assignmentId, {
        responseText,
        ...(fileName ? { fileName } : {}),
        ...(fileSizeLabel ? { fileSizeLabel } : {}),
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.assignments });
      void queryClient.invalidateQueries({
        queryKey: STUDENT_QUERY_KEYS.assignment(variables.assignmentId),
      });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.dashboard });
    },
  });
}

export function useStudentAssessments() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.assessments,
    queryFn: () => studentService.getAssessments(),
  });
}

export function useStudentResources() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.resources,
    queryFn: () => studentService.getResources(),
  });
}

export function useToggleSaveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => studentService.toggleSaveResource(resourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.resources });
    },
  });
}

export function useMarkResourceAccessed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => studentService.markResourceAccessed(resourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.resources });
    },
  });
}

export function useStudentAttendance() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.attendance,
    queryFn: () => studentService.getAttendance(),
  });
}

export function useStudentProgress() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.progress,
    queryFn: () => studentService.getProgress(),
  });
}

export function useStudentAnnouncements() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.announcements,
    queryFn: () => studentService.getAnnouncements(),
  });
}

export function useToggleAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead?: boolean }) =>
      studentService.toggleAnnouncementRead(id, isRead),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.announcements });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.dashboard });
    },
  });
}

export function useMarkAllAnnouncementsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => studentService.markAllAnnouncementsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.announcements });
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.dashboard });
    },
  });
}

export function useStudentTimetable() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.timetable,
    queryFn: () => studentService.getTimetable(),
  });
}

export function useStudentNotifications() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.notifications,
    queryFn: () => studentService.getNotifications(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentService.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => studentService.markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.notifications });
    },
  });
}

export function useStudentSupport() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.support,
    queryFn: () => studentService.getSupportData(),
  });
}

export function useSubmitTeacherMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { teacherId: string; subject: string; message: string }) =>
      studentService.submitTeacherMessage(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.support });
    },
  });
}

export function useSubmitIssueReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { category: string; summary: string; details: string }) =>
      studentService.submitIssueReport(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.support });
    },
  });
}

export function useStudentPreferences() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.preferences,
    queryFn: () => studentService.getPreferences(),
  });
}

export function useUpdateStudentPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<StudentPreferences>) => studentService.updatePreferences(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.preferences });
    },
  });
}
