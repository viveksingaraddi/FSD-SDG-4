import { API_ROUTES, type UserRole } from '@fsd-sdg4/contracts';
import { apiGet, apiPost } from '@/lib/apiClient';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  status: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthUserEnvelope {
  user: AuthUser;
}

export async function fetchMe(signal?: AbortSignal): Promise<AuthUser> {
  const data = await apiGet<AuthUserEnvelope>(API_ROUTES.AUTH.ME, signal ? { signal } : undefined);
  return data.user;
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthUser> {
  const data = await apiPost<AuthUserEnvelope>(API_ROUTES.AUTH.LOGIN, credentials);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await apiPost<unknown>(API_ROUTES.AUTH.LOGOUT);
}
