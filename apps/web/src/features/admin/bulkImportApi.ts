import {
  API_ROUTES,
  type BulkImportCategory,
  type BulkImportJobDto,
  type BulkImportJobsListResponseDto,
  type BulkImportPreviewResponseDto,
  type BulkImportStatus,
} from '@fsd-sdg4/contracts';
import { apiGet, apiPost } from '@/lib/apiClient';

export interface ImportJobsQueryOptions {
  page?: number | undefined;
  limit?: number | undefined;
  category?: BulkImportCategory | 'ALL' | undefined;
  status?: BulkImportStatus | 'ALL' | undefined;
}

/**
 * Uploads a spreadsheet file to generate a validation preview without modifying the database.
 */
export async function fetchImportPreview(
  file: File,
  category: BulkImportCategory,
  signal?: AbortSignal,
): Promise<BulkImportPreviewResponseDto> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  return apiPost<BulkImportPreviewResponseDto>(API_ROUTES.SCHOOL.BULK_IMPORT.PREVIEW, formData, {
    timeoutMs: 60_000,
    ...(signal ? { signal } : {}),
  });
}

/**
 * Executes the bulk import transaction, creates eligible accounts, and optionally dispatches invitations.
 */
export async function executeBulkImport(
  file: File,
  category: BulkImportCategory,
  options: {
    idempotencyKey?: string | undefined;
    skipInvalidRows?: boolean | undefined;
    sendInvitations?: boolean | undefined;
    timeoutMs?: number | undefined;
  } = {},
): Promise<BulkImportJobDto> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (options.idempotencyKey) {
    formData.append('idempotencyKey', options.idempotencyKey);
  }
  if (options.skipInvalidRows !== undefined) {
    formData.append('skipInvalidRows', String(options.skipInvalidRows));
  }
  if (options.sendInvitations !== undefined) {
    formData.append('sendInvitations', String(options.sendInvitations));
  }

  return apiPost<BulkImportJobDto>(API_ROUTES.SCHOOL.BULK_IMPORT.EXECUTE, formData, {
    timeoutMs: options.timeoutMs ?? 120_000,
  });
}

/**
 * Triggers browser download of the sample template (CSV or XLSX) for the specified category.
 */
export async function downloadImportTemplate(
  category: BulkImportCategory,
  format: 'csv' | 'xlsx' = 'csv',
): Promise<void> {
  const url = `${API_ROUTES.SCHOOL.BULK_IMPORT.TEMPLATE}?category=${encodeURIComponent(category)}&format=${encodeURIComponent(format)}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'x-requested-with': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download spreadsheet template.');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `edvarq-${category.toLowerCase()}-import-template.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Fetches the paginated list of past bulk import jobs for the school.
 */
export async function fetchImportJobs(
  query: ImportJobsQueryOptions = {},
  signal?: AbortSignal,
): Promise<BulkImportJobsListResponseDto> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set('page', String(query.page));
  if (query.limit) searchParams.set('limit', String(query.limit));
  if (query.category && query.category !== 'ALL') searchParams.set('category', query.category);
  if (query.status && query.status !== 'ALL') searchParams.set('status', query.status);

  const qs = searchParams.toString();
  const endpoint = `${API_ROUTES.SCHOOL.BULK_IMPORT.JOBS}${qs ? `?${qs}` : ''}`;
  return apiGet<BulkImportJobsListResponseDto>(endpoint, signal ? { signal } : undefined);
}

/**
 * Triggers browser download of the sanitized CSV error report for a specific job.
 */
export async function downloadJobErrorReport(jobId: string): Promise<void> {
  const url = API_ROUTES.SCHOOL.BULK_IMPORT.JOB_ERRORS.replace(':id', encodeURIComponent(jobId));
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'x-requested-with': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download error report.');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `bulk-import-errors-${jobId.slice(0, 8)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
