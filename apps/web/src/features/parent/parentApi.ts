import {
  API_ROUTES,
  type ChildAcademicReportDto,
  type ChildAttendanceMonthSummaryDto,
  type ChildSupportPlanDto,
  type ParentAbsenceNoteResponseDto,
  type ParentChildSummaryDto,
  type ParentFamilyOverviewDto,
} from '@fsd-sdg4/contracts';
import { apiGet, apiPatch, apiPost } from '@/lib/apiClient';

export function fetchParentOverview(signal?: AbortSignal): Promise<ParentFamilyOverviewDto> {
  return apiGet<ParentFamilyOverviewDto>(
    API_ROUTES.PARENT.OVERVIEW,
    signal ? { signal } : undefined,
  );
}

export function fetchLinkedChildren(signal?: AbortSignal): Promise<ParentChildSummaryDto[]> {
  return apiGet<ParentChildSummaryDto[]>(
    API_ROUTES.PARENT.CHILDREN,
    signal ? { signal } : undefined,
  );
}

export function fetchChildAttendance(
  studentId: string,
  month?: string,
  signal?: AbortSignal,
): Promise<ChildAttendanceMonthSummaryDto> {
  const base = API_ROUTES.PARENT.CHILD_ATTENDANCE.replace(':studentId', studentId);
  const url = month ? `${base}?month=${encodeURIComponent(month)}` : base;
  return apiGet<ChildAttendanceMonthSummaryDto>(url, signal ? { signal } : undefined);
}

export function submitAbsenceNote(
  studentId: string,
  payload: { attendanceRecordId: string; reason: string },
): Promise<ParentAbsenceNoteResponseDto> {
  const url = API_ROUTES.PARENT.ABSENCE_NOTES.replace(':studentId', studentId);
  return apiPost<ParentAbsenceNoteResponseDto>(url, payload);
}

export function fetchChildGrades(
  studentId: string,
  signal?: AbortSignal,
): Promise<ChildAcademicReportDto> {
  const url = API_ROUTES.PARENT.CHILD_GRADES.replace(':studentId', studentId);
  return apiGet<ChildAcademicReportDto>(url, signal ? { signal } : undefined);
}

export function fetchChildSupportPlans(
  studentId: string,
  signal?: AbortSignal,
): Promise<ChildSupportPlanDto[]> {
  const url = API_ROUTES.PARENT.CHILD_SUPPORT_PLANS.replace(':studentId', studentId);
  return apiGet<ChildSupportPlanDto[]>(url, signal ? { signal } : undefined);
}

export function updateChildSupportAction(
  studentId: string,
  actionId: string,
  status: 'PENDING' | 'COMPLETED',
): Promise<{ id: string; status: 'PENDING' | 'COMPLETED'; completedAt: string | null }> {
  const url = API_ROUTES.PARENT.SUPPORT_ACTION_UPDATE.replace(':studentId', studentId).replace(
    ':actionId',
    actionId,
  );
  return apiPatch<{ id: string; status: 'PENDING' | 'COMPLETED'; completedAt: string | null }>(
    url,
    { status },
  );
}
