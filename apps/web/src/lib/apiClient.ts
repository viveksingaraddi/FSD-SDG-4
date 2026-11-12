import type {
  ApiErrorResponse,
  ApiMeta,
  ApiSuccessResponse,
  FieldError,
} from '@fsd-sdg4/contracts';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly type: string;
  public readonly requestId?: string | undefined;
  public readonly errors?: FieldError[] | undefined;

  constructor(payload: ApiErrorResponse) {
    super(payload.detail);
    this.name = 'ApiClientError';
    this.status = payload.status;
    this.title = payload.title;
    this.detail = payload.detail;
    this.type = payload.type;
    this.requestId = payload.requestId;
    this.errors = payload.errors;
  }
}

type FetchRequestInit = NonNullable<Parameters<typeof fetch>[1]>;

export interface ApiRequestOptions extends Omit<FetchRequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta?: ApiMeta | undefined;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function getApiBaseUrl(): string {
  const configured = import.meta.env['VITE_API_BASE_URL'] as string | undefined;
  if (configured !== undefined && configured.trim().length > 0) {
    return configured.replace(/\/+$/, '');
  }
  return '';
}

function isApiErrorPayload(value: unknown): value is ApiErrorResponse {
  return (
    value !== null &&
    typeof value === 'object' &&
    'status' in value &&
    typeof (value as { status: unknown }).status === 'number' &&
    'detail' in value &&
    typeof (value as { detail: unknown }).detail === 'string'
  );
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccessResponse<T>> {
  const { body, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = (): void => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const mergedHeaders = new Headers(headers);
  mergedHeaders.set('Accept', 'application/json');
  mergedHeaders.set('X-Requested-With', 'XMLHttpRequest');

  let serializedBody: FormData | string | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      serializedBody = body;
    } else {
      mergedHeaders.set('Content-Type', 'application/json');
      serializedBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      credentials: 'include',
      headers: mergedHeaders,
      ...(serializedBody !== undefined ? { body: serializedBody } : {}),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json') || contentType.includes('+json');
    const parsed: unknown = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      if (isApiErrorPayload(parsed)) {
        throw new ApiClientError({
          ...parsed,
          success: false,
          type: parsed.type || 'about:blank',
          title: parsed.title || response.statusText || 'Request Failed',
        });
      }

      throw new ApiClientError({
        success: false,
        type: 'about:blank',
        title: response.statusText || 'Request Failed',
        status: response.status,
        detail: `HTTP ${response.status} error while calling ${path}.`,
      });
    }

    if (parsed !== null && typeof parsed === 'object' && 'data' in parsed) {
      return {
        ...(parsed as ApiSuccessResponse<T>),
        success: true,
      };
    }

    return {
      success: true,
      data: parsed as T,
    };
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError({
        success: false,
        type: 'https://api.fsd-sdg4.edu/errors/request-timeout',
        title: 'Request Timeout',
        status: 408,
        detail: 'The request timed out or was cancelled.',
      });
    }
    throw new ApiClientError({
      success: false,
      type: 'https://api.fsd-sdg4.edu/errors/network-error',
      title: 'Network Error',
      status: 0,
      detail: err instanceof Error ? err.message : 'Unable to reach the server.',
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function apiGet<T>(
  path: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>,
): Promise<T> {
  const res = await apiRequest<T>(path, { ...options, method: 'GET' });
  return res.data;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>,
): Promise<T> {
  const res = await apiRequest<T>(path, { ...options, method: 'POST', body });
  return res.data;
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>,
): Promise<T> {
  const res = await apiRequest<T>(path, { ...options, method: 'PATCH', body });
  return res.data;
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>,
): Promise<T> {
  const res = await apiRequest<T>(path, { ...options, method: 'PUT', body });
  return res.data;
}

export async function apiDelete<T>(
  path: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>,
): Promise<T> {
  const res = await apiRequest<T>(path, { ...options, method: 'DELETE' });
  return res.data;
}
