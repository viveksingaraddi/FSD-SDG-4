import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders role-specific navigation and handles sign out', async () => {
    const fetchMock = vi
      .fn()
      // GET /api/v1/auth/me
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              user: {
                id: 'user-admin-1',
                email: 'admin@example.edu',
                role: 'SCHOOL_ADMIN',
                schoolId: 'school-1',
                status: 'ACTIVE',
                permissions: [],
              },
            },
            meta: { requestId: 'req-me', timestamp: new Date().toISOString() },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      // POST /api/v1/auth/logout
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { loggedOut: true },
            meta: { requestId: 'req-logout', timestamp: new Date().toISOString() },
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
                <AppShell title="School Dashboard" breadcrumbs={[{ label: 'School Dashboard' }]}>
                  <div>Dashboard Content</div>
                </AppShell>
              }
            />
            <Route path="/login" element={<div>Login Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('admin@example.edu')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Academic Setup').length).toBeGreaterThan(0);
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => {
      expect(screen.getByText('Login Screen')).toBeInTheDocument();
    });
  });
});
