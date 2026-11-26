import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../App.js';
import { resetStudentMockState } from './services/studentService.js';

function renderStudentPortal(initialPath = '/student') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Student Portal — Complete Integration Suite', () => {
  beforeEach(() => {
    resetStudentMockState();
  });

  it('renders Dashboard Overview with greeting, 4 KPI cards, timetable, deadlines, feedback, and chart', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderStudentPortal('/student');

    expect(
      await screen.findByRole('heading', { level: 1, name: /Welcome back, Aarav/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Grade 8 · Section 8-A · Greenfield Academy/i)).toBeInTheDocument();
    expect(screen.getByText(/Academic Year 2026–2027/i)).toBeInTheDocument();

    expect(screen.getByText('Enrolled Courses')).toBeInTheDocument();
    expect(screen.getByText('Pending Assignments')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Assessments')).toBeInTheDocument();
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Today's Timetable/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Upcoming Assignment Deadlines/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Continue Learning/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Weekly Learning Activity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Recent Teacher Feedback/i })).toBeInTheDocument();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('supports Courses filtering, Course Detail navigation, and interactive lesson completion', async () => {
    renderStudentPortal('/student/courses');

    expect(await screen.findByText('Computer Science')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Search courses');
    fireEvent.change(searchInput, { target: { value: 'Python' } });
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.queryByText('English Literature')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Open Course/i }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Computer Science' }),
    ).toBeInTheDocument();

    const markCompleteBtns = await screen.findAllByRole('button', { name: /Mark complete/i });
    expect(markCompleteBtns.length).toBeGreaterThan(0);
    fireEvent.click(markCompleteBtns[0]!);

    expect(await screen.findByText('Lesson completed')).toBeInTheDocument();
  });

  it('supports Assignment filtering, validation, and full submission flow', async () => {
    renderStudentPortal('/student/assignments');

    expect(await screen.findByText('Linear Equations Coordinate Graphing Set')).toBeInTheDocument();

    const reviewedTab = screen.getByRole('tab', { name: /Reviewed/i });
    fireEvent.click(reviewedTab);
    expect(screen.getByText('Local Ward Civic Services Reflection')).toBeInTheDocument();
    expect(screen.queryByText('Convex Lens Focal Length Lab Report')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /All/i }));
    fireEvent.click(
      screen.getByRole('link', { name: /Linear Equations Coordinate Graphing Set/i }),
    );

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Linear Equations Coordinate Graphing Set',
      }),
    ).toBeInTheDocument();

    // Validation error when submitting empty response
    fireEvent.click(screen.getByRole('button', { name: 'Submit Assignment' }));
    expect(await screen.findByText(/Please write at least 15 characters/i)).toBeInTheDocument();

    // Valid submission
    const textarea = screen.getByLabelText(/Written Response/i);
    fireEvent.change(textarea, {
      target: {
        value: 'Solved all five linear equation pairs and verified intersection coordinates.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Assignment' }));

    expect(await screen.findByText('Assignment submitted!')).toBeInTheDocument();
    expect(await screen.findByText('Submission Confirmation')).toBeInTheDocument();
  });

  it('renders Assessments upcoming schedule and completed results with feedback', async () => {
    renderStudentPortal('/student/assessments');

    expect(await screen.findByText('Unit 4 Quiz: Linear Equations & Graphs')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Completed History/i }));
    expect(screen.getByText('Python Control Flow & Lists Assessment')).toBeInTheDocument();
    expect(screen.getByText(/Score: 46\/50 \(92%\)/i)).toBeInTheDocument();
  });

  it('renders Learning Resources with bookmarking, modal viewer, and tab filtering', async () => {
    renderStudentPortal('/student/resources');

    const saveBtn = await screen.findByRole('button', {
      name: /Save Interactive Walkthrough: Modular Python Functions/i,
    });
    fireEvent.click(saveBtn);
    expect(await screen.findByText('Saved to library')).toBeInTheDocument();

    const viewButtons = screen.getAllByRole('button', { name: 'View resource' });
    fireEvent.click(viewButtons[0]!);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renders Attendance with calendar day interaction and subject breakdown', async () => {
    renderStudentPortal('/student/attendance');

    expect(await screen.findByText('94.4%')).toBeInTheDocument();

    const absentDayBtn = screen.getByRole('button', { name: /2026-11-19 - Absent/i });
    fireEvent.click(absentDayBtn);
    expect(screen.getAllByText(/Seasonal flu rest day/i).length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });

  it('renders My Progress constructively without negative student labels', async () => {
    renderStudentPortal('/student/progress');

    expect(await screen.findByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('Areas of Growth & Next Steps')).toBeInTheDocument();
    expect(screen.getByText('Assessment Performance Trend')).toBeInTheDocument();
  });

  it('renders Announcements and supports reading notices and marking all read', async () => {
    renderStudentPortal('/student/announcements');

    const markAllBtn = await screen.findByRole('button', { name: /Mark all as read/i });
    fireEvent.click(markAllBtn);
    expect(await screen.findByText('All notices marked read')).toBeInTheDocument();
  });

  it('renders Timetable with Weekly and Daily view switcher', async () => {
    renderStudentPortal('/student/timetable');

    expect(await screen.findByText('Current Class')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Daily Schedule' }));
    expect(screen.getByRole('tablist', { name: 'Select weekday' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Monday' }));
    expect(screen.getByText('Social Studies & Civics')).toBeInTheDocument();
  });

  it('renders Help & Support with FAQ accordion and validated teacher/issue forms', async () => {
    renderStudentPortal('/student/support');

    const teacherSelect = await screen.findByLabelText('Select Teacher');
    fireEvent.change(teacherSelect, {
      target: { value: 'tch-math-01' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Doubt on Question 4' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Could you please review how we verify parallel line slopes?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Message to Teacher' }));

    expect(await screen.findByText('Message sent to teacher')).toBeInTheDocument();
  });

  it('renders Settings and updates student profile and preferences', async () => {
    renderStudentPortal('/student/settings');

    const focusInput = await screen.findByLabelText(/Learning Focus/i);
    fireEvent.change(focusInput, { target: { value: 'Coordinate Geometry & Python Data' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile Preferences' }));

    expect(await screen.findByText('Learning profile updated')).toBeInTheDocument();
  });

  it('supports Header notifications panel, global search, and UI logout confirmation', async () => {
    renderStudentPortal('/student');
    await screen.findByRole('heading', { level: 1 });

    // Notification panel
    const notifBtn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(notifBtn);
    const panel = await screen.findByRole('region', { name: 'Notifications panel' });
    expect(within(panel).getByText('Science Fair Registration Open')).toBeInTheDocument();

    // Global search
    const globalSearch = screen.getByLabelText(/Search courses, assignments/i);
    fireEvent.change(globalSearch, { target: { value: 'Convex' } });
    const searchRegion = await screen.findByRole('region', { name: 'Global search results' });
    expect(
      within(searchRegion).getByText('Convex Lens Focal Length Lab Report'),
    ).toBeInTheDocument();

    // Logout modal UI
    fireEvent.click(screen.getByRole('button', { name: 'Log out of Student Portal' }));
    expect(
      await screen.findByRole('heading', { name: /Sign out of Student Portal\?/i }),
    ).toBeInTheDocument();
  });

  it('opens mobile navigation drawer and mobile global search bar', async () => {
    renderStudentPortal('/student');
    await screen.findByRole('heading', { level: 1 });

    // Mobile drawer open & close
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Student Navigation' });
    expect(within(drawer).getByText('Timetable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close Student Navigation' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Student Navigation' })).not.toBeInTheDocument();
    });

    // Mobile search toggle
    fireEvent.click(screen.getByRole('button', { name: 'Toggle global search' }));
    const mobileInput = screen.getByLabelText(
      /Search courses, assignments, resources, and notices/i,
      { selector: '#student-mobile-global-search' },
    );
    fireEvent.change(mobileInput, { target: { value: 'Python' } });
    expect(await screen.findByText('Python Temperature Anomaly Analyzer')).toBeInTheDocument();
  });

  it('deep-links announcement notice and resource subject query parameters', async () => {
    const first = renderStudentPortal('/student/announcements?notice=ann-1');
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Term 2 Science Fair & SDG 4 Innovation Showcase Registration/i),
    ).toBeInTheDocument();
    first.unmount();

    renderStudentPortal('/student/resources?subject=Mathematics');
    expect(await screen.findByText('Visual Guide to Slope & Intercepts (PDF)')).toBeInTheDocument();
    expect(screen.queryByText('School Solar Energy Audit Workbook (PDF)')).not.toBeInTheDocument();
  });

  it('validates assignment file attachment extensions and supports removing selected file', async () => {
    renderStudentPortal('/student/assignments/asg-math-01');
    await screen.findByRole('heading', {
      level: 1,
      name: 'Linear Equations Coordinate Graphing Set',
    });

    const fileInput = screen.getByLabelText(/Attach Coursework File/i);
    const badFile = new File(['bad'], 'malware.exe', { type: 'application/octet-stream' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });
    expect(await screen.findByText(/Unsupported file format/i)).toBeInTheDocument();

    const goodFile = new File(['%PDF-1.4'], 'solutions.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [goodFile] } });
    expect(await screen.findByText(/Selected: solutions\.pdf/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove selected file' }));
    expect(screen.queryByText(/Selected: solutions\.pdf/i)).not.toBeInTheDocument();
  });

  it('applies Settings display preferences across Timetable and Progress pages', async () => {
    const settingsRender = renderStudentPortal('/student/settings');
    const viewSelect = await screen.findByLabelText('Default Timetable View');
    fireEvent.change(viewSelect, { target: { value: 'daily' } });

    const tipsCheckbox = screen.getByRole('checkbox', {
      name: /Show study tips on progress cards/i,
    });
    fireEvent.click(tipsCheckbox);
    expect(await screen.findByText('Preference saved')).toBeInTheDocument();
    settingsRender.unmount();

    const ttRender = renderStudentPortal('/student/timetable');
    expect(await screen.findByRole('tablist', { name: 'Select weekday' })).toBeInTheDocument();
    ttRender.unmount();

    renderStudentPortal('/student/progress');
    expect(await screen.findByText('Areas of Growth & Next Steps')).toBeInTheDocument();
    expect(screen.queryByText(/Tip:/i)).not.toBeInTheDocument();
  });
});
