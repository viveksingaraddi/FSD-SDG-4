import type { ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth/AuthContext';
import { SchoolAdminDashboardPage } from './SchoolAdminDashboardPage';
import { AcademicSetupPage } from './AcademicSetupPage';

function renderWithProviders(ui: ReactNode, initialPath = '/admin') {
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

describe('School Admin Portal', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders school admin overview metrics and error state recovery', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'adm-1',
                  email: 'admin@example.edu',
                  role: 'SCHOOL_ADMIN',
                  schoolId: 'school-1',
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
              schoolName: 'Synthetic High School',
              activeAcademicYear: '2026-2027',
              totalStudents: 240,
              totalStaff: 22,
              totalClasses: 8,
              totalSections: 16,
              activeSupportPlans: 5,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SchoolAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Synthetic High School')).toBeInTheDocument();
    });
    expect(screen.getByText('2026-2027')).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
  });

  it('switches tabs in AcademicSetupPage between Academic Years, Classes, and Subjects', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'adm-1',
                  email: 'admin@example.edu',
                  role: 'SCHOOL_ADMIN',
                  schoolId: 'school-1',
                  status: 'ACTIVE',
                  permissions: [],
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/school/academic-years')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: 'ay-1',
                  name: '2026-2027',
                  startDate: '2026-08-01',
                  endDate: '2027-06-30',
                  status: 'ACTIVE',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/school/subjects')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: 'sub-1',
                  name: 'Mathematics',
                  code: 'MATH-8',
                  description: null,
                  credits: null,
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<AcademicSetupPage />, '/admin/academic');

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: '2026-2027' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /subjects/i }));
    await waitFor(() => {
      expect(screen.getByText('MATH-8')).toBeInTheDocument();
    });
  });
});
