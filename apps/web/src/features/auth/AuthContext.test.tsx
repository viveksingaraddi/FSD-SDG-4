import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, getRoleHomePath } from './AuthContext';
import { LoginPage } from './LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

describe('AuthContext, LoginPage, and ProtectedRoute', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps each UserRole to its canonical portal home path', () => {
    expect(getRoleHomePath('SUPER_ADMIN')).toBe('/super-admin');
    expect(getRoleHomePath('SCHOOL_ADMIN')).toBe('/admin');
    expect(getRoleHomePath('TEACHER')).toBe('/teacher');
    expect(getRoleHomePath('STUDENT')).toBe('/student');
    expect(getRoleHomePath('PARENT')).toBe('/parent');
  });

  it('validates login form inputs and signs in via cookie-backed API', async () => {
    const fetchMock = vi
      .fn()
      // Initial /api/v1/auth/me returns 401
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: 'https://httpstatuses.com/401',
            title: 'Unauthorized',
            status: 401,
            detail: 'Not authenticated',
          }),
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      )
      // POST /api/v1/auth/login succeeds
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              user: {
                id: 'user-teacher-1',
                email: 'teacher@example.edu',
                role: 'TEACHER',
                schoolId: 'school-1',
                status: 'ACTIVE',
                permissions: [],
              },
            },
            meta: { requestId: 'req-login', timestamp: new Date().toISOString() },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <div>Teacher Workspace</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    // Submit empty form to verify Zod validation
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    // Fill valid synthetic credentials and submit
    fireEvent.change(screen.getByLabelText(/institutional email/i), {
      target: { value: 'teacher@example.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'SyntheticPass!123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Teacher Workspace')).toBeInTheDocument();
    });
  });

  it('redirects authenticated user to /unauthorized when role is disallowed', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            user: {
              id: 'user-student-1',
              email: 'student@example.edu',
              role: 'STUDENT',
              schoolId: 'school-1',
              status: 'ACTIVE',
              permissions: [],
            },
          },
          meta: { requestId: 'req-me', timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                  <div>Admin Only</div>
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<div>Unauthorized View</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Unauthorized View')).toBeInTheDocument();
    });
  });
});
