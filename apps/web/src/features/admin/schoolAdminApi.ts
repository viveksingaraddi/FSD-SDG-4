import {
  API_ROUTES,
  type AcademicYearDto,
  type AuditLogDto,
  type ClassDto,
  type CompleteOnboardingResultDto,
  type CourseOfferingDto,
  type OfferingTeacherDto,
  type SaveOnboardingProgressResultDto,
  type SchoolOnboardingStatusDto,
  type SchoolOverviewDto,
  type SchoolSettingsDto,
  type SectionDto,
  type StaffMemberDto,
  type StudentDirectoryDto,
  type SubjectDto,
  type TeacherAllocationDto,
  type TeacherDetailDto,
  type UserInvitationDto,
} from '@fsd-sdg4/contracts';
import type {
  AllocateTeacherInput,
  AssignOfferingTeacherInput,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateOfferingInput,
  CreateSectionInput,
  CreateStaffInput,
  CreateStudentInput,
  CreateSubjectInput,
  InvitationFilterQuery,
  InviteUserInput,
  OfferingFilterQuery,
  SaveOnboardingProgressInput,
  StaffFilterQuery,
  UpdateAcademicYearInput,
  UpdateClassInput,
  UpdateSchoolSettingsInput,
  UpdateSectionInput,
  UpdateStaffInput,
  UpdateSubjectInput,
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

export function updateAcademicYearRequest(
  id: string,
  input: UpdateAcademicYearInput,
): Promise<AcademicYearDto> {
  return apiPatch<AcademicYearDto>(
    `${API_ROUTES.SCHOOL.ACADEMIC_YEARS}/${encodeURIComponent(id)}`,
    input,
  );
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

export function updateClassRequest(id: string, input: UpdateClassInput): Promise<ClassDto> {
  return apiPatch<ClassDto>(`${API_ROUTES.SCHOOL.CLASSES}/${encodeURIComponent(id)}`, input);
}

export function deleteClassRequest(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`${API_ROUTES.SCHOOL.CLASSES}/${encodeURIComponent(id)}`);
}

export function createSectionRequest(input: CreateSectionInput): Promise<SectionDto> {
  return apiPost<SectionDto>(API_ROUTES.SCHOOL.SECTIONS, input);
}

export function updateSectionRequest(id: string, input: UpdateSectionInput): Promise<SectionDto> {
  return apiPatch<SectionDto>(`${API_ROUTES.SCHOOL.SECTIONS}/${encodeURIComponent(id)}`, input);
}

export function deleteSectionRequest(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`${API_ROUTES.SCHOOL.SECTIONS}/${encodeURIComponent(id)}`);
}

export function fetchSubjects(signal?: AbortSignal): Promise<SubjectDto[]> {
  return apiGet<SubjectDto[]>(API_ROUTES.SCHOOL.SUBJECTS, signal ? { signal } : undefined);
}

export function createSubjectRequest(input: CreateSubjectInput): Promise<SubjectDto> {
  return apiPost<SubjectDto>(API_ROUTES.SCHOOL.SUBJECTS, input);
}

export function updateSubjectRequest(id: string, input: UpdateSubjectInput): Promise<SubjectDto> {
  return apiPatch<SubjectDto>(`${API_ROUTES.SCHOOL.SUBJECTS}/${encodeURIComponent(id)}`, input);
}

export function deleteSubjectRequest(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`${API_ROUTES.SCHOOL.SUBJECTS}/${encodeURIComponent(id)}`);
}

export function fetchCourseOfferings(
  filter?: OfferingFilterQuery,
  signal?: AbortSignal,
): Promise<CourseOfferingDto[]> {
  const params = new URLSearchParams();
  if (filter?.academicYearId) params.set('academicYearId', filter.academicYearId);
  if (filter?.classId) params.set('classId', filter.classId);
  if (filter?.sectionId) params.set('sectionId', filter.sectionId);
  if (filter?.subjectId) params.set('subjectId', filter.subjectId);

  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiGet<CourseOfferingDto[]>(
    `${API_ROUTES.SCHOOL.OFFERINGS}${qs}`,
    signal ? { signal } : undefined,
  );
}

export function createCourseOfferingRequest(
  input: CreateOfferingInput,
): Promise<CourseOfferingDto> {
  return apiPost<CourseOfferingDto>(API_ROUTES.SCHOOL.OFFERINGS, input);
}

export function deleteCourseOfferingRequest(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `${API_ROUTES.SCHOOL.OFFERINGS}/${encodeURIComponent(id)}`,
  );
}

export function assignOfferingTeacherRequest(
  id: string,
  input: AssignOfferingTeacherInput,
): Promise<OfferingTeacherDto> {
  return apiPost<OfferingTeacherDto>(
    `${API_ROUTES.SCHOOL.OFFERINGS}/${encodeURIComponent(id)}/teachers`,
    input,
  );
}

export function removeOfferingTeacherRequest(
  id: string,
  teacherId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `${API_ROUTES.SCHOOL.OFFERINGS}/${encodeURIComponent(id)}/teachers/${encodeURIComponent(teacherId)}`,
  );
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

export function fetchSchoolInvitations(
  query?: InvitationFilterQuery,
  signal?: AbortSignal,
): Promise<UserInvitationDto[]> {
  const params = new URLSearchParams();
  if (query?.search && query.search.trim().length > 0) params.set('search', query.search.trim());
  if (query?.status && query.status !== 'ALL') params.set('status', query.status);
  if (query?.role && query.role !== 'ALL') params.set('role', query.role);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiGet<UserInvitationDto[]>(
    `${API_ROUTES.SCHOOL.INVITATIONS}${qs}`,
    signal ? { signal } : undefined,
  );
}

export function inviteSchoolUserRequest(input: InviteUserInput): Promise<UserInvitationDto> {
  return apiPost<UserInvitationDto>(API_ROUTES.SCHOOL.INVITATIONS, input);
}

export function resendSchoolInvitationRequest(id: string): Promise<UserInvitationDto> {
  return apiPost<UserInvitationDto>(
    `${API_ROUTES.SCHOOL.INVITATIONS}/${encodeURIComponent(id)}/resend`,
  );
}

export function revokeSchoolInvitationRequest(id: string): Promise<UserInvitationDto> {
  return apiDelete<UserInvitationDto>(`${API_ROUTES.SCHOOL.INVITATIONS}/${encodeURIComponent(id)}`);
}

export function fetchSchoolOnboarding(signal?: AbortSignal): Promise<SchoolOnboardingStatusDto> {
  return apiGet<SchoolOnboardingStatusDto>(
    API_ROUTES.SCHOOL.ONBOARDING,
    signal ? { signal } : undefined,
  );
}

export function saveOnboardingProgressRequest(
  input: SaveOnboardingProgressInput,
): Promise<SaveOnboardingProgressResultDto> {
  return apiPost<SaveOnboardingProgressResultDto>(API_ROUTES.SCHOOL.ONBOARDING_PROGRESS, input);
}

export function completeSchoolOnboardingRequest(): Promise<CompleteOnboardingResultDto> {
  return apiPost<CompleteOnboardingResultDto>(API_ROUTES.SCHOOL.ONBOARDING_COMPLETE, {});
}
