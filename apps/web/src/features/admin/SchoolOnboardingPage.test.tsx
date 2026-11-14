import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth/AuthContext';
import { SchoolOnboardingPage } from './SchoolOnboardingPage';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

const mockOnboardingData = {
  schoolId: 'school-1',
  schoolName: 'Greenwood International',
  isComplete: false,
  completionPercentage: 28,
  currentStep: 'classes-sections',
  completedSteps: ['profile', 'academic-year'],
  pendingSteps: ['classes-sections', 'subjects', 'teachers', 'students', 'parents'],
  steps: {
    profile: {
      isComplete: true,
      name: 'Greenwood International',
      code: 'GWD-01',
      subdomain: 'greenwood',
      contactEmail: 'admin@greenwood.edu',
      status: 'ACTIVE',
    },
    academicYear: {
      isComplete: true,
      count: 1,
      activeYear: {
        id: 'year-1',
        name: '2026-2027 Academic Year',
        startDate: '2026-08-01',
        endDate: '2027-06-30',
        status: 'ACTIVE',
        sectionCount: 2,
      },
    },
    classesSections: { isComplete: false, classCount: 0, sectionCount: 0 },
    subjects: { isComplete: false, count: 0 },
    teachers: { isComplete: false, count: 0, invitedCount: 0 },
    students: { isComplete: false, count: 0 },
    parents: { isComplete: false, count: 0, invitedCount: 0 },
  },
  summary: {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSections: 0,
    totalSubjects: 0,
    hasActiveYear: true,
  },
  lastSavedAt: new Date().toISOString(),
};

describe('SchoolOnboardingPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders onboarding wizard header, progress bar, and steps navigation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: string | URL) => {
        const url = String(input);
        if (url.includes('/api/v1/auth/me')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  user: {
                    id: 'admin-1',
                    email: 'admin@greenwood.edu',
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
        if (url.includes('/api/v1/school/onboarding')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: mockOnboardingData }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.includes('/api/v1/school/classes')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.includes('/api/v1/school/academic-years')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      }),
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/onboarding']}>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/admin/onboarding" element={<SchoolOnboardingPage />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Header inspection
    expect(await screen.findByText(/Initial School Setup Guide/i)).toBeInTheDocument();
    expect(screen.getByText('28% Configured')).toBeInTheDocument();
    expect(screen.getByText(/Greenwood International/i)).toBeInTheDocument();

    // Progress bar accessible check
    const progressBar = screen.getByRole('progressbar', {
      name: /school onboarding setup completion/i,
    });
    expect(progressBar).toHaveAttribute('aria-valuenow', '28');

    // Sidebar navigation steps check
    expect(screen.getByText('1. School Profile')).toBeInTheDocument();
    expect(screen.getByText('2. Academic Year')).toBeInTheDocument();
    expect(screen.getByText('3. Classes & Sections')).toBeInTheDocument();
    expect(screen.getByText('4. Curriculum Subjects')).toBeInTheDocument();
    expect(screen.getByText('5. Faculty & Teachers')).toBeInTheDocument();
    expect(screen.getByText('6. Student Enrollment')).toBeInTheDocument();
    expect(screen.getByText('7. Parents & Guardians')).toBeInTheDocument();
    expect(screen.getByText('8. Setup Summary')).toBeInTheDocument();
  });

  it('navigates through steps and allows saving progress bookmark', async () => {
    let savedStepReceived = '';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/v1/auth/me')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  user: {
                    id: 'admin-1',
                    email: 'admin@greenwood.edu',
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
        if (url.includes('/api/v1/school/onboarding/progress') && init?.method === 'POST') {
          const body = JSON.parse(String(init.body)) as { step: string };
          savedStepReceived = body.step;
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: { success: true, savedStep: body.step, savedAt: new Date().toISOString() },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        if (url.includes('/api/v1/school/onboarding')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: mockOnboardingData }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.includes('/api/v1/school/classes')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.includes('/api/v1/school/academic-years')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.includes('/api/v1/school/subjects')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      }),
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/onboarding']}>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/admin/onboarding" element={<SchoolOnboardingPage />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Save Progress')).toBeInTheDocument();

    // Click Save Progress button
    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }));
    await waitFor(() => {
      expect(savedStepReceived).toBe('classes-sections');
    });

    // Advance to next step (Subjects)
    fireEvent.click(screen.getByRole('button', { name: /Continue to Next Step/i }));
    await waitFor(() => {
      expect(savedStepReceived).toBe('subjects');
    });
  });

  it('completes onboarding setup and navigates to school dashboard', async () => {
    let completedRequested = false;

    const completedOnboarding = {
      ...mockOnboardingData,
      isComplete: true,
      completionPercentage: 100,
      currentStep: 'summary',
      completedSteps: [
        'profile',
        'academic-year',
        'classes-sections',
        'subjects',
        'teachers',
        'students',
        'parents',
      ],
      pendingSteps: [],
      steps: {
        ...mockOnboardingData.steps,
        classesSections: { isComplete: true, classCount: 2, sectionCount: 4 },
        subjects: { isComplete: true, count: 5 },
        teachers: { isComplete: true, count: 3, invitedCount: 0 },
        students: { isComplete: true, count: 25 },
        parents: { isComplete: true, count: 20, invitedCount: 0 },
      },
      summary: {
        totalStudents: 25,
        totalTeachers: 3,
        totalClasses: 2,
        totalSections: 4,
        totalSubjects: 5,
        hasActiveYear: true,
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/v1/auth/me')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  user: {
                    id: 'admin-1',
                    email: 'admin@greenwood.edu',
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
        if (url.includes('/api/v1/school/onboarding/complete') && init?.method === 'POST') {
          completedRequested = true;
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: { success: true, completedAt: new Date().toISOString() },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        if (url.includes('/api/v1/school/onboarding')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: completedOnboarding }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      }),
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/onboarding']}>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/admin/onboarding" element={<SchoolOnboardingPage />} />
                <Route path="/admin" element={<div>Dashboard Home</div>} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Institutional Setup Summary/i)).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // students
    expect(screen.getByText('3')).toBeInTheDocument(); // teachers

    const completeBtn = screen.getByRole('button', {
      name: /Complete Setup & Launch Dashboard/i,
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(completedRequested).toBe(true);
      expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
    });
  });
});
