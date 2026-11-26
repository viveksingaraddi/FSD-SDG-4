import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import {
  createTeacherAssignment,
  fetchTeacherClasses,
  fetchTeacherDashboard,
  submitAttendanceRoster,
} from './teacherApi';
import type {
  CreateTeacherAssignmentInput,
  SubmitAttendanceRosterInput,
} from '@fsd-sdg4/validation';

export function TeacherDashboardPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // 1. Fetch dashboard telemetry
  const dashboardQuery = useQuery({
    queryKey: ['teacher', 'dashboard'],
    queryFn: ({ signal }) => fetchTeacherDashboard(signal),
  });

  // 2. Fetch classes for modals
  const classesQuery = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: ({ signal }) => fetchTeacherClasses(signal),
  });

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Form for New Assignment Modal
  const {
    register: regAssign,
    handleSubmit: handleAssignSubmit,
    reset: resetAssign,
    formState: { errors: assignErrors, isSubmitting: isAssignSubmitting },
  } = useForm<{
    courseOfferingId: string;
    title: string;
    instructions: string;
    maxPoints: number;
    dueDate: string;
  }>({
    defaultValues: {
      courseOfferingId: '',
      title: '',
      instructions: '',
      maxPoints: 50,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (values: CreateTeacherAssignmentInput) => createTeacherAssignment(values),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      showToast({
        title: 'Assignment Published',
        description: `"${created.title}" is now active and accessible to enrolled students.`,
        variant: 'success',
      });
      setAssignmentModalOpen(false);
      resetAssign();
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (values: SubmitAttendanceRosterInput) => submitAttendanceRoster(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      showToast({
        title: 'Attendance Recorded',
        description: 'Morning classroom roster successfully synchronized with school records.',
        variant: 'success',
      });
      setAttendanceModalOpen(false);
    },
  });

  const handleQuickAttendanceSubmit = () => {
    if (!selectedSectionId) return;
    const currentClass = classesQuery.data?.find((c) => c.sectionId === selectedSectionId);
    if (!currentClass) return;

    markAttendanceMutation.mutate({
      sectionId: selectedSectionId,
      attendanceDate: new Date().toISOString().slice(0, 10),
      records: [
        { studentId: '10000000-0000-4000-8000-000000000121', status: 'PRESENT' },
        { studentId: '10000000-0000-4000-8000-000000000122', status: 'PRESENT' },
      ],
    });
  };

  if (dashboardQuery.isLoading) {
    return (
      <AppShell title="Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <AppShell title="Dashboard">
        <ErrorState
          title="Unable to load teacher dashboard"
          description={
            dashboardQuery.error instanceof ApiClientError
              ? dashboardQuery.error.detail
              : 'Failed to synchronize faculty telemetry with the school database.'
          }
          onRetry={() => void dashboardQuery.refetch()}
        />
      </AppShell>
    );
  }

  const { teacher, stats, timetableToday, attendanceOverview, recentActivities, upcomingTasks } =
    dashboardQuery.data;

  return (
    <AppShell
      title="Teacher Dashboard"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-lg font-bold text-white shadow-xs">
                {teacher.firstName[0]}
                {teacher.lastName[0]}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Heading level={2} size="h2" className="text-xl font-bold tracking-tight">
                    {getGreeting()}, {teacher.firstName} {teacher.lastName}
                  </Heading>
                  <Badge variant="brand">{teacher.specialization ?? 'Faculty Member'}</Badge>
                  <Badge variant="neutral">{teacher.schoolName}</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {currentDateFormatted} &bull; Employee ID: {teacher.employeeId}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CalendarCheck className="h-4 w-4" />}
                onClick={() => {
                  if (classesQuery.data && classesQuery.data.length > 0) {
                    const firstSection = classesQuery.data[0];
                    if (firstSection) {
                      setSelectedSectionId(firstSection.sectionId);
                    }
                  }
                  setAttendanceModalOpen(true);
                }}
              >
                Mark Attendance
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setAssignmentModalOpen(true)}
              >
                Create Assignment
              </Button>
            </div>
          </div>
        </div>

        {/* 5 Top Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card padding="md" className="flex flex-col justify-between border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span className="text-xs font-medium uppercase tracking-wider">Assigned Classes</span>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight">{stats.assignedClassesCount}</div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Active grade sections</p>
            </div>
          </Card>

          <Card
            padding="md"
            className="flex flex-col justify-between border-l-4 border-l-emerald-500"
          >
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span className="text-xs font-medium uppercase tracking-wider">Total Students</span>
              <Users className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight">{stats.totalStudentsCount}</div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Enrolled learners</p>
            </div>
          </Card>

          <Card
            padding="md"
            className="flex flex-col justify-between border-l-4 border-l-indigo-500"
          >
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span className="text-xs font-medium uppercase tracking-wider">Attendance Today</span>
              <CalendarCheck className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {stats.attendanceToday.attendanceRate}%
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  {stats.attendanceToday.present} Present
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {stats.attendanceToday.absent} absent &bull; {stats.attendanceToday.late} late
              </p>
            </div>
          </Card>

          <Card
            padding="md"
            className="flex flex-col justify-between border-l-4 border-l-amber-500"
          >
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Tasks</span>
              <ClipboardList className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight">
                {stats.pendingAssignmentsCount}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Assignments to evaluate</p>
            </div>
          </Card>

          <Card
            padding="md"
            className="flex flex-col justify-between border-l-4 border-l-purple-500"
          >
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span className="text-xs font-medium uppercase tracking-wider">Upcoming Exams</span>
              <GraduationCap className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight">
                {stats.upcomingExaminationsCount}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Scheduled assessments</p>
            </div>
          </Card>
        </div>

        {/* 2-Column Section: Timetable & Attendance Overview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Today's Timetable */}
          <Card padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div>
                <Heading level={3} size="h3" className="font-semibold text-base">
                  Today's Schedule &amp; Classes
                </Heading>
                <Text variant="small" className="text-[var(--color-text-muted)]">
                  Live course offerings and classroom locations for {currentDateFormatted}.
                </Text>
              </div>
              <Badge variant="brand">
                <Clock className="h-3 w-3 mr-1" />
                {timetableToday.length} Periods
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {timetableToday.length === 0 ? (
                <EmptyState
                  title="No classes scheduled today"
                  description="You do not have any teaching periods scheduled on the timetable today."
                />
              ) : (
                timetableToday.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-canvas)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)] font-semibold text-xs text-[var(--color-text-primary)]">
                        {slot.subjectCode.slice(0, 4)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {slot.subjectName}
                          </p>
                          <span className="text-xs text-[var(--color-text-muted)]">&bull;</span>
                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            {slot.className} - {slot.sectionName}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {slot.roomNumber ?? 'Main Hall'} &bull; {slot.startTime} &ndash;{' '}
                          {slot.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <Badge
                        variant={
                          slot.status === 'IN_PROGRESS'
                            ? 'warning'
                            : slot.status === 'COMPLETED'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {slot.status === 'IN_PROGRESS'
                          ? 'In Session'
                          : slot.status === 'COMPLETED'
                            ? 'Completed'
                            : 'Upcoming'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Attendance Overview Card */}
          <Card padding="lg">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div>
                <Heading level={3} size="h3" className="font-semibold text-base">
                  Weekly Attendance
                </Heading>
                <Text variant="small" className="text-[var(--color-text-muted)]">
                  Student presence rate across your assigned cohorts.
                </Text>
              </div>
            </div>

            <div className="mt-4 flex flex-col justify-between h-[230px]">
              <div className="flex items-center justify-around py-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {attendanceOverview.present}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Present</p>
                </div>
                <div className="h-8 w-px bg-[var(--color-border-default)]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-rose-600">{attendanceOverview.absent}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Absent</p>
                </div>
                <div className="h-8 w-px bg-[var(--color-border-default)]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{attendanceOverview.late}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Late</p>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="mt-4">
                <div className="flex items-end justify-between h-24 gap-2 pt-2 px-1">
                  {attendanceOverview.weeklyTrend.map((t) => (
                    <div key={t.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                        {t.rate}%
                      </span>
                      <div className="w-full bg-[var(--color-surface-sunken)] rounded-t-md h-16 flex items-end">
                        <div
                          className="w-full bg-[var(--color-brand-primary)] rounded-t-md transition-all duration-500"
                          style={{ height: `${t.rate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                        {t.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border-default)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>Cohort Average</span>
                <span className="font-semibold text-emerald-600">
                  {attendanceOverview.attendanceRate}% Attendance Rate
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* 2-Column Section: Recent Activity & Upcoming Tasks */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity Stream */}
          <Card padding="lg">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div>
                <Heading level={3} size="h3" className="font-semibold text-base">
                  Recent Activities
                </Heading>
                <Text variant="small" className="text-[var(--color-text-muted)]">
                  Classroom updates, student submissions, and institutional audit events.
                </Text>
              </div>
            </div>

            <div className="mt-4 divide-y divide-[var(--color-border-default)]">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {act.title}
                      </p>
                      <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Tasks Checklist */}
          <Card padding="lg">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div>
                <Heading level={3} size="h3" className="font-semibold text-base">
                  Upcoming Priorities &amp; Tasks
                </Heading>
                <Text variant="small" className="text-[var(--color-text-muted)]">
                  Evaluation deadlines and upcoming examination checkpoints.
                </Text>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    task.completed
                      ? 'border-[var(--color-border-default)] bg-[var(--color-surface-sunken)]/50 opacity-60'
                      : 'border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'line-through text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Due: {task.dueDate} &bull; {task.category}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      task.priority === 'HIGH'
                        ? 'danger'
                        : task.priority === 'MEDIUM'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Mark Attendance Quick Action */}
      <Modal
        open={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title="Quick Classroom Attendance Roster"
        footer={
          <>
            <Button variant="outline" onClick={() => setAttendanceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={markAttendanceMutation.isPending}
              onClick={handleQuickAttendanceSubmit}
            >
              Submit All Present (Roster)
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Text variant="small" className="text-[var(--color-text-muted)]">
            Record morning presence for your active teaching cohorts. This updates records across
            the school and notifies authorized guardians.
          </Text>

          <FormField label="Select Class & Section" required>
            {(props) => (
              <Select
                {...props}
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                options={
                  classesQuery.data?.map((c) => ({
                    value: c.sectionId,
                    label: `${c.className} - ${c.sectionName} (${c.subjectName})`,
                  })) ?? []
                }
              />
            )}
          </FormField>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Quick Roster Mode will mark all enrolled students in the section as{' '}
              <strong>PRESENT</strong> for today ({currentDateFormatted}). You can adjust individual
              statuses anytime.
            </span>
          </div>
        </div>
      </Modal>

      {/* Modal: Create Assignment */}
      <Modal
        open={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        title="Create New Course Assignment"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-assignment-form"
              variant="primary"
              loading={isAssignSubmitting || createAssignmentMutation.isPending}
            >
              Publish Assignment
            </Button>
          </>
        }
      >
        <form
          id="create-assignment-form"
          onSubmit={handleAssignSubmit((data) =>
            createAssignmentMutation.mutate(data as CreateTeacherAssignmentInput),
          )}
          className="space-y-4"
        >
          <FormField
            label="Class & Course Offering"
            error={assignErrors.courseOfferingId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...regAssign('courseOfferingId', { required: 'Please select a course offering' })}
                options={[
                  { value: '', label: 'Select assigned course offering...' },
                  ...(classesQuery.data?.map((c) => ({
                    value: c.courseOfferingId,
                    label: `${c.className} - ${c.sectionName} : ${c.subjectName} (${c.subjectCode})`,
                  })) ?? []),
                ]}
              />
            )}
          </FormField>

          <FormField label="Assignment Title" error={assignErrors.title?.message} required>
            {(props) => (
              <Input
                {...props}
                {...regAssign('title', { required: 'Title is required' })}
                placeholder="e.g. Chapter 4: Algebraic Fractions & Word Problems"
              />
            )}
          </FormField>

          <FormField
            label="Instructions & Prompt"
            error={assignErrors.instructions?.message}
            required
          >
            {(props) => (
              <textarea
                {...props}
                {...regAssign('instructions', { required: 'Instructions are required' })}
                rows={3}
                className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-primary)]"
                placeholder="Specify requirements, deliverables, and submission guidelines..."
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Maximum Marks / Points"
              error={assignErrors.maxPoints?.message}
              required
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  {...regAssign('maxPoints', { valueAsNumber: true })}
                />
              )}
            </FormField>

            <FormField label="Submission Due Date" error={assignErrors.dueDate?.message} required>
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  {...regAssign('dueDate', { required: 'Due date is required' })}
                />
              )}
            </FormField>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export default TeacherDashboardPage;
