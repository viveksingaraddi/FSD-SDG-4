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

export function fetchSchools(
  search?: string,
  status?: string,
  signal?: AbortSignal,
): Promise<SchoolSummaryDto[]> {
  const params = new URLSearchParams();
  if (search && search.trim().length > 0) params.set('search', search.trim());
  if (status && status !== 'ALL') params.set('status', status);
  const qs = params.toString() ? `?${params.toString()}` : '';
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

export interface FetchAuditLogsParams {
  action?: string;
  schoolId?: string;
}

export function fetchPlatformAuditLogs(
  filterOrAction?: string | FetchAuditLogsParams,
  maybeSignal?: AbortSignal,
): Promise<AuditLogDto[]> {
  const params = new URLSearchParams();
  const signal = maybeSignal;

  if (typeof filterOrAction === 'string') {
    if (filterOrAction.trim().length > 0) {
      params.set('action', filterOrAction.trim());
    }
  } else if (filterOrAction && typeof filterOrAction === 'object') {
    if (filterOrAction.action && filterOrAction.action.trim().length > 0) {
      params.set('action', filterOrAction.action.trim());
    }
    if (filterOrAction.schoolId && filterOrAction.schoolId.trim().length > 0) {
      params.set('schoolId', filterOrAction.schoolId.trim());
    }
  }

  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiGet<AuditLogDto[]>(
    `${API_ROUTES.SUPER_ADMIN.AUDIT_LOGS}${qs}`,
    signal ? { signal } : undefined,
  );
}
