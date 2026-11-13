import {
  API_ROUTES,
  type AcademicYearDto,
  type AuditLogDto,
  type ClassDto,
  type SchoolOverviewDto,
  type SchoolSettingsDto,
  type SectionDto,
  type StaffMemberDto,
  type StudentDirectoryDto,
  type SubjectDto,
  type TeacherAllocationDto,
  type TeacherDetailDto,
} from '@fsd-sdg4/contracts';
import type {
  AllocateTeacherInput,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateSectionInput,
  CreateStaffInput,
  CreateStudentInput,
  CreateSubjectInput,
  StaffFilterQuery,
  UpdateSchoolSettingsInput,
  UpdateStaffInput,
} from '@fsd-sdg4/validation';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/apiClient';

export function fetchSchoolOverview(signal?: AbortSignal): Promise<SchoolOverviewDto> {
  return apiGet<SchoolOverviewDto>(API_ROUTES.SCHOOL.OVERVIEW, signal ? { signal } : undefined);
}

export function fetchAcademicYears(signal?: AbortSignal): Promise<AcademicYearDto[]> {
  return apiGet<AcademicYearDto[]>(
    API_ROUTES.SCHOOL.ACADEMIC_YEARS,
    signal ? { signal } : undefined,
  );
}

export function createAcademicYearRequest(
  input: CreateAcademicYearInput,
): Promise<AcademicYearDto> {
  return apiPost<AcademicYearDto>(API_ROUTES.SCHOOL.ACADEMIC_YEARS, input);
}

export function activateAcademicYearRequest(id: string): Promise<AcademicYearDto> {
  return apiPatch<AcademicYearDto>(
    `${API_ROUTES.SCHOOL.ACADEMIC_YEARS}/${encodeURIComponent(id)}/activate`,
  );
}

export function fetchClasses(signal?: AbortSignal): Promise<ClassDto[]> {
  return apiGet<ClassDto[]>(API_ROUTES.SCHOOL.CLASSES, signal ? { signal } : undefined);
}

export function createClassRequest(input: CreateClassInput): Promise<ClassDto> {
  return apiPost<ClassDto>(API_ROUTES.SCHOOL.CLASSES, input);
}

export function createSectionRequest(input: CreateSectionInput): Promise<SectionDto> {
  return apiPost<SectionDto>(API_ROUTES.SCHOOL.SECTIONS, input);
}

export function fetchSubjects(signal?: AbortSignal): Promise<SubjectDto[]> {
  return apiGet<SubjectDto[]>(API_ROUTES.SCHOOL.SUBJECTS, signal ? { signal } : undefined);
}

export function createSubjectRequest(input: CreateSubjectInput): Promise<SubjectDto> {
  return apiPost<SubjectDto>(API_ROUTES.SCHOOL.SUBJECTS, input);
}

export function fetchStaff(
  query?: StaffFilterQuery,
  signal?: AbortSignal,
): Promise<StaffMemberDto[]> {
  const params = new URLSearchParams();
  if (query?.search?.trim()) params.set('search', query.search.trim());
  if (query?.status && query.status !== 'ALL') params.set('status', query.status);
  if (query?.specialization?.trim()) params.set('specialization', query.specialization.trim());

  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiGet<StaffMemberDto[]>(
    `${API_ROUTES.SCHOOL.STAFF}${qs}`,
    signal ? { signal } : undefined,
  );
}

export function fetchStaffById(id: string, signal?: AbortSignal): Promise<TeacherDetailDto> {
  return apiGet<TeacherDetailDto>(
    `${API_ROUTES.SCHOOL.STAFF}/${encodeURIComponent(id)}`,
    signal ? { signal } : undefined,
  );
}

export function createStaffRequest(input: CreateStaffInput): Promise<StaffMemberDto> {
  return apiPost<StaffMemberDto>(API_ROUTES.SCHOOL.STAFF, input);
}

export function updateStaffRequest(id: string, input: UpdateStaffInput): Promise<StaffMemberDto> {
  return apiPatch<StaffMemberDto>(`${API_ROUTES.SCHOOL.STAFF}/${encodeURIComponent(id)}`, input);
}

export function updateStaffStatusRequest(
  id: string,
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED',
): Promise<StaffMemberDto> {
  return apiPatch<StaffMemberDto>(`${API_ROUTES.SCHOOL.STAFF}/${encodeURIComponent(id)}/status`, {
    status,
  });
}

export function allocateTeacherRequest(
  id: string,
  input: AllocateTeacherInput,
): Promise<TeacherAllocationDto> {
  return apiPost<TeacherAllocationDto>(
    `${API_ROUTES.SCHOOL.STAFF}/${encodeURIComponent(id)}/allocations`,
    input,
  );
}

export function deallocateTeacherRequest(
  id: string,
  allocationId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `${API_ROUTES.SCHOOL.STAFF}/${encodeURIComponent(id)}/allocations/${encodeURIComponent(allocationId)}`,
  );
}

export function deleteStaffRequest(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`${API_ROUTES.SCHOOL.STAFF}/${encodeURIComponent(id)}`);
}

export function fetchStudents(
  search?: string,
  signal?: AbortSignal,
): Promise<StudentDirectoryDto[]> {
  const qs =
    search && search.trim().length > 0 ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiGet<StudentDirectoryDto[]>(
    `${API_ROUTES.SCHOOL.STUDENTS}${qs}`,
    signal ? { signal } : undefined,
  );
}

export function createStudentRequest(input: CreateStudentInput): Promise<StudentDirectoryDto> {
  return apiPost<StudentDirectoryDto>(API_ROUTES.SCHOOL.STUDENTS, input);
}

export function fetchSchoolAuditLogs(signal?: AbortSignal): Promise<AuditLogDto[]> {
  return apiGet<AuditLogDto[]>(API_ROUTES.SCHOOL.AUDIT_LOGS, signal ? { signal } : undefined);
}

export function fetchSchoolSettings(signal?: AbortSignal): Promise<SchoolSettingsDto> {
  return apiGet<SchoolSettingsDto>(API_ROUTES.SCHOOL.SETTINGS, signal ? { signal } : undefined);
}

export function updateSchoolSettingsRequest(
  input: UpdateSchoolSettingsInput,
): Promise<SchoolSettingsDto> {
  return apiPatch<SchoolSettingsDto>(API_ROUTES.SCHOOL.SETTINGS, input);
}
