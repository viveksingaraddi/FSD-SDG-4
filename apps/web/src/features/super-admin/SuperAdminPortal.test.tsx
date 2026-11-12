import type { ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth/AuthContext';
import { SuperAdminDashboardPage } from './SuperAdminDashboardPage';
import { SchoolsDirectoryPage } from './SchoolsDirectoryPage';

function renderWithProviders(ui: ReactNode, initialPath = '/super-admin') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ToastProvider>
          <AuthProvider>{ui}</AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Super Admin Portal', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders platform overview metrics from /api/v1/super-admin/overview', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'sup-1',
                  email: 'superadmin@example.edu',
                  role: 'SUPER_ADMIN',
                  schoolId: null,
                  status: 'ACTIVE',
                  permissions: [],
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              totalSchools: 4,
              activeSchools: 3,
              suspendedSchools: 1,
              totalUsers: 42,
              recentAuditEvents: 18,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SuperAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
    expect(screen.getByText('3 Active')).toBeInTheDocument();
  });

  it('renders schools directory and validates new school modal', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'sup-1',
                  email: 'superadmin@example.edu',
                  role: 'SUPER_ADMIN',
                  schoolId: null,
                  status: 'ACTIVE',
                  permissions: [],
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'sch-1',
                name: 'Synthetic Academy',
                code: 'SYNTH01',
                subdomain: 'synthetic-academy',
                contactEmail: 'admin@synthetic.edu',
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                userCount: 15,
                studentCount: 120,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SchoolsDirectoryPage />, '/super-admin/schools');

    await waitFor(() => {
      expect(screen.getByText('Synthetic Academy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /provision school/i }));
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });
});
