import {
  API_ROUTES,
  type TeacherAnnouncementDto,
  type TeacherAssessmentDto,
  type TeacherAssignmentDto,
  type TeacherAttendanceRosterDto,
  type TeacherClassSectionDto,
  type TeacherDashboardDto,
  type TeacherMessageDto,
  type TeacherStudentDto,
  type TeacherSummaryDto,
  type TeacherTimetableItemDto,
} from '@fsd-sdg4/contracts';
import type {
  CreateTeacherAssessmentInput,
  CreateTeacherAssignmentInput,
  SubmitAttendanceRosterInput,
} from '@fsd-sdg4/validation';
import { apiGet, apiPost } from '@/lib/apiClient';

export async function fetchTeacherDashboard(signal?: AbortSignal): Promise<TeacherDashboardDto> {
  const res = await apiGet<TeacherDashboardDto>(
    API_ROUTES.TEACHER.DASHBOARD,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function fetchTeacherClasses(signal?: AbortSignal): Promise<TeacherClassSectionDto[]> {
  const res = await apiGet<TeacherClassSectionDto[]>(
    API_ROUTES.TEACHER.CLASSES,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function fetchTeacherStudents(
  search?: string,
  signal?: AbortSignal,
): Promise<TeacherStudentDto[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await apiGet<TeacherStudentDto[]>(
    `${API_ROUTES.TEACHER.STUDENTS}${query}`,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function fetchAttendanceRoster(
  sectionId?: string,
  date?: string,
  signal?: AbortSignal,
): Promise<TeacherAttendanceRosterDto> {
  const params = new URLSearchParams();
  if (sectionId) params.append('sectionId', sectionId);
  if (date) params.append('date', date);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await apiGet<TeacherAttendanceRosterDto>(
    `${API_ROUTES.TEACHER.ATTENDANCE}${query}`,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function submitAttendanceRoster(
  payload: SubmitAttendanceRosterInput,
): Promise<{ count: number; date: string }> {
  const res = await apiPost<{ count: number; date: string }>(
    API_ROUTES.TEACHER.ATTENDANCE,
    payload,
  );
  return res;
}

export async function fetchTeacherAssignments(
  signal?: AbortSignal,
): Promise<TeacherAssignmentDto[]> {
  const res = await apiGet<TeacherAssignmentDto[]>(
    API_ROUTES.TEACHER.ASSIGNMENTS,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function createTeacherAssignment(
  payload: CreateTeacherAssignmentInput,
): Promise<TeacherAssignmentDto> {
  const res = await apiPost<TeacherAssignmentDto>(API_ROUTES.TEACHER.ASSIGNMENTS, payload);
  return res;
}

export async function fetchTeacherAssessments(
  signal?: AbortSignal,
): Promise<TeacherAssessmentDto[]> {
  const res = await apiGet<TeacherAssessmentDto[]>(
    API_ROUTES.TEACHER.ASSESSMENTS,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function createTeacherAssessment(
  payload: CreateTeacherAssessmentInput,
): Promise<TeacherAssessmentDto> {
  const res = await apiPost<TeacherAssessmentDto>(API_ROUTES.TEACHER.ASSESSMENTS, payload);
  return res;
}

export async function fetchTeacherTimetable(
  signal?: AbortSignal,
): Promise<TeacherTimetableItemDto[]> {
  const res = await apiGet<TeacherTimetableItemDto[]>(
    API_ROUTES.TEACHER.TIMETABLE,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function fetchTeacherAnnouncements(
  signal?: AbortSignal,
): Promise<TeacherAnnouncementDto[]> {
  const res = await apiGet<TeacherAnnouncementDto[]>(
    API_ROUTES.TEACHER.ANNOUNCEMENTS,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function fetchTeacherMessages(signal?: AbortSignal): Promise<TeacherMessageDto[]> {
  const res = await apiGet<TeacherMessageDto[]>(
    API_ROUTES.TEACHER.MESSAGES,
    signal ? { signal } : undefined,
  );
  return res;
}

export async function fetchTeacherProfile(signal?: AbortSignal): Promise<TeacherSummaryDto> {
  const res = await apiGet<TeacherSummaryDto>(
    API_ROUTES.TEACHER.PROFILE,
    signal ? { signal } : undefined,
  );
  return res;
}
