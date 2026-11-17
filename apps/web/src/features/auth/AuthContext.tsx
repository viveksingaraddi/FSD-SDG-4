import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserRole } from '@fsd-sdg4/contracts';
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  type AuthUser,
  type LoginCredentials,
} from './authApi';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

const ROLE_HOME_PATHS: Record<UserRole, string> = {
  SUPER_ADMIN: '/super-admin',
  SCHOOL_ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
};

export function getRoleHomePath(role: UserRole): string {
  return ROLE_HOME_PATHS[role];
}

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshSession = useCallback(async (signal?: AbortSignal): Promise<AuthUser | null> => {
    try {
      const currentUser = await fetchMe(signal);
      setUser(currentUser);
      setStatus('authenticated');
      return currentUser;
    } catch {
      if (signal?.aborted) {
        return null;
      }
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshSession(controller.signal);
    return () => {
      controller.abort();
    };
  }, [refreshSession]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const loggedInUser = await loginRequest(credentials);
    setUser(loggedInUser);
    setStatus('authenticated');
    return loggedInUser;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && user !== null,
      isLoading: status === 'loading',
      login,
      logout,
      refreshSession: () => refreshSession(),
    }),
    [user, status, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
