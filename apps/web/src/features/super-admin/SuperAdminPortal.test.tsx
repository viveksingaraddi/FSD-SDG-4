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

  it('renders user demographics, institutional scale, alerts, and audit logs', async () => {
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
      if (url.includes('/api/v1/super-admin/audit-logs')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: 'log-101',
                  schoolId: 'sch-001',
                  actorId: 'sup-1',
                  actorEmail: 'admin@platform.edu',
                  action: 'PLATFORM_SCHOOL_CREATED',
                  entityType: 'School',
                  entityId: 'sch-001',
                  createdAt: '2026-11-12T12:00:00.000Z',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              totalSchools: 5,
              activeSchools: 4,
              suspendedSchools: 1,
              archivedSchools: 0,
              totalUsers: 100,
              recentAuditEvents: 25,
              usersByRole: {
                students: 70,
                teachers: 20,
                schoolAdmins: 8,
                parents: 1,
                superAdmins: 1,
              },
              schoolsAnalytics: {
                active: 4,
                suspended: 1,
                archived: 0,
                totalClasses: 32,
                totalSections: 64,
              },
              alerts: [
                {
                  id: 'alert-1',
                  level: 'warning',
                  title: '1 Suspended School Tenant',
                  description: 'Requires inspection.',
                  actionUrl: '/super-admin/schools',
                  actionLabel: 'Inspect',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SuperAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    expect(screen.getByText('1 Suspended School Tenant')).toBeInTheDocument();
    expect(screen.getByText('Classes Configured')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText('64')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PLATFORM_SCHOOL_CREATED')).toBeInTheDocument();
    });
  });

  it('renders error state and retries successfully upon user click', async () => {
    let failFirst = true;
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
      if (failFirst && url.includes('/api/v1/super-admin/overview')) {
        failFirst = false;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              error: { code: 'INTERNAL_ERROR', message: 'Telemetry gateway offline' },
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              totalSchools: 2,
              activeSchools: 2,
              suspendedSchools: 0,
              totalUsers: 10,
              recentAuditEvents: 4,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SuperAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load platform overview')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
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
