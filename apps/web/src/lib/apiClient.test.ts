import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiClientError, apiGet, apiPost } from './apiClient';

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends credentials: include and X-Requested-With header on requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { ok: true },
          meta: { requestId: 'req-1', timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiGet<{ ok: boolean }>('/api/v1/health');
    expect(data).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, NonNullable<Parameters<typeof fetch>[1]>];
    expect(init.credentials).toBe('include');
    const headers = new Headers(init.headers);
    expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });

  it('throws typed ApiClientError when backend returns RFC 7807 problem details', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'https://httpstatuses.com/422',
          title: 'Validation Failed',
          status: 422,
          detail: 'Email is invalid',
          requestId: 'req-422',
          errors: [{ field: 'email', message: 'Invalid email' }],
        }),
        { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiPost('/api/v1/auth/login', { email: 'bad' })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 422,
      title: 'Validation Failed',
      detail: 'Email is invalid',
      requestId: 'req-422',
    });

    try {
      await apiPost('/api/v1/auth/login', { email: 'bad' });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
    }
  });
});
