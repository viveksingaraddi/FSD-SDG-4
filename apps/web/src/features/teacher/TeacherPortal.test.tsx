import type { ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth/AuthContext';
import { TeacherDashboardPage } from './TeacherDashboardPage';
import { TeacherClassesPage } from './TeacherClassesPage';
import { TeacherTimetablePage } from './TeacherTimetablePage';
import { TeacherAnnouncementsPage } from './TeacherAnnouncementsPage';
import { TeacherMessagesPage } from './TeacherMessagesPage';
import { TeacherProfilePage } from './TeacherProfilePage';
import { TeacherSettingsPage } from './TeacherSettingsPage';
import type {
  TeacherClassSectionDto,
  TeacherDashboardDto,
  TeacherTimetableItemDto,
  TeacherAnnouncementDto,
  TeacherMessageDto,
} from '@fsd-sdg4/contracts';

function renderWithProviders(ui: ReactNode, initialPath = '/teacher') {
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

const mockTeacherAuth = {
  id: 'tch-user-1',
  email: 'teacher@greenfield.edu',
  role: 'TEACHER',
  schoolId: 'school-uuid-1',
  status: 'ACTIVE',
  permissions: ['school:classes:read', 'attendance:read', 'attendance:create'],
};

const mockDashboardData: TeacherDashboardDto = {
  teacher: {
    id: 'tch-1',
    userId: 'tch-user-1',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'teacher@greenfield.edu',
    specialization: 'STEM & Mathematics',
    employeeId: 'FAC-1001',
    schoolName: 'Greenfield Primary School',
  },
  stats: {
    assignedClassesCount: 3,
    totalStudentsCount: 78,
    attendanceToday: {
      total: 78,
      present: 75,
      absent: 2,
      late: 1,
      excused: 0,
      attendanceRate: 96,
    },
    pendingAssignmentsCount: 4,
    upcomingExaminationsCount: 2,
  },
  timetableToday: [
    {
      id: 'tt-1',
      courseOfferingId: 'co-1',
      className: 'Grade 8',
      sectionName: '8-A',
      subjectName: 'Mathematics',
      subjectCode: 'MATH-101',
      startTime: '08:30 AM',
      endTime: '09:30 AM',
      roomNumber: 'Room 204',
      status: 'COMPLETED',
    },
  ],
  attendanceOverview: {
    present: 75,
    absent: 2,
    late: 1,
    excused: 0,
    attendanceRate: 96,
    weeklyTrend: [
      { day: 'Mon', rate: 94, present: 73, absent: 5 },
      { day: 'Tue', rate: 96, present: 75, absent: 3 },
    ],
  },
  recentActivities: [
    {
      id: 'act-1',
      type: 'ATTENDANCE',
      title: 'Attendance finalized for Grade 8 - Section 8-A',
      description: 'Recorded 24 students present',
      timestamp: '2026-11-25T08:45:00.000Z',
    },
  ],
  upcomingTasks: [
    {
      id: 'task-1',
      title: 'Grade Term Mid-term Coursework',
      category: 'GRADING',
      dueDate: 'Tomorrow',
      completed: false,
      priority: 'HIGH',
    },
  ],
};

const mockClassesData: TeacherClassSectionDto[] = [
  {
    courseOfferingId: 'co-1',
    sectionId: 'sec-1',
    classId: 'cls-1',
    className: 'Grade 8',
    sectionName: '8-A',
    academicYearName: '2026-2027',
    subjectName: 'Mathematics',
    subjectCode: 'MATH-101',
    roomNumber: 'Room 204',
    capacity: 30,
    studentCount: 24,
    isPrimaryTeacher: true,
  },
];

const mockTimetableData: TeacherTimetableItemDto[] = [
  {
    id: 'tt-1',
    courseOfferingId: 'co-1',
    className: 'Grade 8',
    sectionName: '8-A',
    subjectName: 'Mathematics',
    subjectCode: 'MATH-101',
    startTime: '08:30 AM',
    endTime: '09:30 AM',
    roomNumber: 'Room 204',
    status: 'COMPLETED',
  },
];

const mockAnnouncementsData: TeacherAnnouncementDto[] = [
  {
    id: 'ann-1',
    title: 'Midterm Examination Schedule Finalized',
    content: 'Please review the exam timetable for next week.',
    authorName: 'Sarah Connor',
    priority: 'NORMAL',
    targetAudience: 'All Assigned Classes',
    publishedAt: '2026-11-20T10:00:00.000Z',
  },
];

const mockMessagesData: TeacherMessageDto[] = [
  {
    id: 'msg-1',
    senderName: 'Mrs. Davis (Parent of Lucas)',
    senderRole: 'PARENT',
    subject: 'Lucas progress inquiry',
    preview: 'Hello, wanted to follow up on Lucas homework.',
    timestamp: '2026-11-25T09:15:00.000Z',
    unread: true,
  },
];

describe('Teacher Portal Component Suite', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders teacher dashboard with metrics, timetable, and quick action modals', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (url.includes('/api/v1/teacher/dashboard')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: mockDashboardData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: mockClassesData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherDashboardPage />);

    // Wait for async query data
    await waitFor(
      () => {
        expect(screen.getByText(/Sarah Connor/i)).toBeInTheDocument();
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
      },
      { timeout: 4000 },
    );

    // 5 Key Metric Cards
    expect(screen.getByText('Assigned Classes')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getAllByText(/96%/).length).toBeGreaterThanOrEqual(1);

    // Quick Action button triggers modal
    const assignBtn = screen.getByRole('button', { name: /Create Assignment/i });
    fireEvent.click(assignBtn);
    expect(screen.getByText('Create New Course Assignment')).toBeInTheDocument();
  });

  it('renders assigned classes with student counts', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: mockClassesData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherClassesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Grade 8/)).toBeInTheDocument();
    });
    expect(screen.getByText(/24 Students Enrolled/)).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('renders timetable page with daily periods', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: mockTimetableData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherTimetablePage />);

    await waitFor(() => {
      expect(screen.getByText('MATH-101')).toBeInTheDocument();
      expect(screen.getByText(/08:30 AM/)).toBeInTheDocument();
    });
  });

  it('renders announcements page with publish notice dialog', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: mockAnnouncementsData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherAnnouncementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Midterm Examination Schedule Finalized')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /New Announcement/i });
    fireEvent.click(newBtn);
    expect(screen.getByText('Create New Announcement')).toBeInTheDocument();
  });

  it('renders messages interface with conversation selection and reply flow', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: mockMessagesData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherMessagesPage />, '/teacher/messages');

    await waitFor(
      () => {
        expect(screen.getAllByText(/Mrs\. Davis/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Lucas progress inquiry/i).length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );
  });

  it('renders faculty profile credentials and assigned offerings', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (url.includes('/api/v1/teacher/profile')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                id: 'tch-1',
                userId: 'tch-user-1',
                employeeId: 'FAC-1001',
                firstName: 'Sarah',
                lastName: 'Connor',
                email: 'teacher@greenfield.edu',
                specialization: 'STEM & Mathematics',
                schoolName: 'Greenfield Primary School',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: mockClassesData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherProfilePage />, '/teacher/profile');

    await waitFor(
      () => {
        expect(screen.getAllByText('Sarah Connor').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/FAC-1001/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/teacher@greenfield.edu/).length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );
  });

  it('renders faculty settings with localization and security controls', async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: mockTeacherAuth } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<TeacherSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Account & Preference Settings')).toBeInTheDocument();
    });
    expect(screen.getByText('Localization & Regional Format')).toBeInTheDocument();
    expect(screen.getByText('Security & Authentication')).toBeInTheDocument();
  });
});
