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
              attendance: {
                recordedDate: '2026-10-14',
                totalRecorded: 48,
                present: 44,
                absent: 2,
                late: 1,
                excused: 1,
                attendanceRate: 94,
                trend: [
                  { date: '2026-10-12', present: 45, absent: 3, total: 48, rate: 94 },
                  { date: '2026-10-13', present: 46, absent: 2, total: 48, rate: 96 },
                  { date: '2026-10-14', present: 45, absent: 3, total: 48, rate: 94 },
                ],
              },
              academic: {
                activeAssignments: 6,
                upcomingAssessments: 2,
                totalAssessments: 12,
                recentAssessments: [
                  {
                    id: 'assm-1',
                    title: 'Midterm Algebra Exam',
                    assessmentDate: '2026-10-25',
                    subjectName: 'Mathematics',
                    className: 'Grade 8 (8A)',
                    maxMarks: 100,
                    weightPercentage: 25,
                  },
                ],
              },
              activity: {
                recentStudents: [
                  {
                    id: 'std-1',
                    name: 'Alex Johnson',
                    studentIdNumber: 'STU-2026-001',
                    createdAt: '2026-10-10T10:00:00Z',
                  },
                ],
                recentAuditLogs: [
                  {
                    id: 'aud-1',
                    schoolId: 'school-1',
                    actorId: 'adm-1',
                    actorEmail: 'admin@example.edu',
                    action: 'SCHOOL_STUDENT_ENROLL',
                    entityType: 'StudentProfile',
                    entityId: 'std-1',
                    delta: null,
                    ipAddress: '127.0.0.1',
                    createdAt: '2026-10-10T10:00:00Z',
                  },
                ],
              },
              alerts: [
                {
                  id: 'pending-support-flags',
                  type: 'ACTION_REQUIRED',
                  title: 'Student Support Flags Require Review',
                  message:
                    '2 student support flags proposed by teachers require administrative review.',
                  actionUrl: '/admin/settings',
                  actionLabel: 'Review Audit & Logs',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SchoolAdminDashboardPage />);

    // School Overview & Tenant Isolation Badge
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Synthetic High School' })).toBeInTheDocument();
    });
    expect(screen.getByText(/Tenant-Isolated Domain:/)).toBeInTheDocument();
    expect(screen.getByText('2026-2027')).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Attendance Overview Section
    expect(screen.getByText('Attendance Overview')).toBeInTheDocument();
    expect(screen.getAllByText('94%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Recorded for: 2026-10-14')).toBeInTheDocument();

    // Academic Overview Section
    expect(screen.getByText('Academic Overview')).toBeInTheDocument();
    expect(screen.getByText('Midterm Algebra Exam')).toBeInTheDocument();
    expect(screen.getByText(/Grade 8 \(8A\)/)).toBeInTheDocument();

    // Staff & Student Activity Section
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('ID: STU-2026-001')).toBeInTheDocument();
    expect(screen.getByText('SCHOOL_STUDENT_ENROLL')).toBeInTheDocument();

    // Alerts & Notifications Section
    expect(screen.getByText('Student Support Flags Require Review')).toBeInTheDocument();
    expect(screen.getByText('Review Audit & Logs')).toBeInTheDocument();
  });

  it('renders empty states when attendance and assessments are not yet recorded', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'adm-2',
                  email: 'admin2@example.edu',
                  role: 'SCHOOL_ADMIN',
                  schoolId: 'school-2',
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
              schoolName: 'Fresh Academy',
              activeAcademicYear: null,
              totalStudents: 0,
              totalStaff: 0,
              totalClasses: 0,
              totalSections: 0,
              activeSupportPlans: 0,
              attendance: {
                recordedDate: '2026-11-13',
                totalRecorded: 0,
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
                attendanceRate: 0,
                trend: [],
              },
              academic: {
                activeAssignments: 0,
                upcomingAssessments: 0,
                totalAssessments: 0,
                recentAssessments: [],
              },
              activity: {
                recentStudents: [],
                recentAuditLogs: [],
              },
              alerts: [
                {
                  id: 'no-active-year',
                  type: 'WARNING',
                  title: 'No Active Academic Year',
                  message: 'Designate an active academic year to enable class scheduling.',
                  actionUrl: '/admin/academic',
                  actionLabel: 'Configure Academic Year',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SchoolAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Fresh Academy' })).toBeInTheDocument();
    });

    expect(screen.getByText('No Attendance Data Recorded')).toBeInTheDocument();
    expect(screen.getByText('No Assessments Created')).toBeInTheDocument();
    expect(screen.getByText('No Students Registered')).toBeInTheDocument();
    expect(screen.getByText('No Active Academic Year')).toBeInTheDocument();
  });

  it('renders error state and allows retry on overview fetch failure', async () => {
    let callCount = 0;
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
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: 'Network connection lost.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              schoolName: 'Recovered School',
              activeAcademicYear: '2026-2027',
              totalStudents: 10,
              totalStaff: 2,
              totalClasses: 1,
              totalSections: 1,
              activeSupportPlans: 0,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<SchoolAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load school overview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Recovered School' })).toBeInTheDocument();
    });
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
