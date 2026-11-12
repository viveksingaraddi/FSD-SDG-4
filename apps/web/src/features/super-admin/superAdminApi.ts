import {
  API_ROUTES,
  type AuditLogDto,
  type PlatformOverviewDto,
  type SchoolDetailDto,
  type SchoolSummaryDto,
} from '@fsd-sdg4/contracts';
import type { CreateSchoolInput, UpdateSchoolInput } from '@fsd-sdg4/validation';
import { apiGet, apiPatch, apiPost } from '@/lib/apiClient';

export function fetchPlatformOverview(signal?: AbortSignal): Promise<PlatformOverviewDto> {
  return apiGet<PlatformOverviewDto>(
    API_ROUTES.SUPER_ADMIN.OVERVIEW,
    signal ? { signal } : undefined,
  );
}

export function fetchSchools(search?: string, signal?: AbortSignal): Promise<SchoolSummaryDto[]> {
  const qs =
    search && search.trim().length > 0 ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiGet<SchoolSummaryDto[]>(
    `${API_ROUTES.SUPER_ADMIN.SCHOOLS}${qs}`,
    signal ? { signal } : undefined,
  );
}

export function fetchSchoolDetail(
  schoolId: string,
  signal?: AbortSignal,
): Promise<SchoolDetailDto> {
  return apiGet<SchoolDetailDto>(
    `${API_ROUTES.SUPER_ADMIN.SCHOOLS}/${encodeURIComponent(schoolId)}`,
    signal ? { signal } : undefined,
  );
}

export function createSchoolRequest(input: CreateSchoolInput): Promise<SchoolSummaryDto> {
  return apiPost<SchoolSummaryDto>(API_ROUTES.SUPER_ADMIN.SCHOOLS, input);
}

export function updateSchoolRequest(
  schoolId: string,
  input: UpdateSchoolInput,
): Promise<SchoolSummaryDto> {
  return apiPatch<SchoolSummaryDto>(
    `${API_ROUTES.SUPER_ADMIN.SCHOOLS}/${encodeURIComponent(schoolId)}`,
    input,
  );
}

export function fetchPlatformAuditLogs(
  action?: string,
  signal?: AbortSignal,
): Promise<AuditLogDto[]> {
  const qs =
    action && action.trim().length > 0 ? `?action=${encodeURIComponent(action.trim())}` : '';
  return apiGet<AuditLogDto[]>(
    `${API_ROUTES.SUPER_ADMIN.AUDIT_LOGS}${qs}`,
    signal ? { signal } : undefined,
  );
}
