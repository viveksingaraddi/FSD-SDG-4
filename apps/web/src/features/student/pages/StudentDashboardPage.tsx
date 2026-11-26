import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  CalendarCheckIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ClockIcon,
  FileCheckIcon,
  MapPinIcon,
  SparklesIcon,
} from '../../../components/icons/Icons.js';
import {
  ASSIGNMENT_STATUS_META,
  EmptyState,
  LoadingState,
  ProgressChart,
  StatCard,
  StudentLayout,
} from '../../../components/student/index.js';
import { Badge, Card } from '../../../components/ui/index.js';
import { useStudentCourses, useStudentDashboard } from '../hooks/useStudentPortal.js';

export function StudentDashboardPage() {
  const { data, isLoading, isError, refetch } = useStudentDashboard();
  const { data: allCourses } = useStudentCourses();

  return (
    <StudentLayout breadcrumbs={[{ label: 'Student Portal' }, { label: 'Overview' }]}>
      {isLoading ? (
        <LoadingState label="Loading your learning overview..." />
      ) : isError || !data ? (
        <EmptyState
          title="Unable to load dashboard"
          description="We could not load your learning summary right now. Please try again."
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white cursor-pointer"
            >
              Retry
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Welcome Header */}
          <Card className="bg-white">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <span>Thursday, November 26, 2026</span>
                  <span aria-hidden="true">·</span>
                  <span>Academic Year {data.profile.academicYear}</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                  Welcome back, {data.profile.firstName}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {data.profile.gradeName} · {data.profile.sectionName} · {data.profile.schoolName}{' '}
                  — You have {data.pendingAssignmentsCount} assignments to complete and{' '}
                  {data.upcomingAssessmentsCount} upcoming assessments on your calendar.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/student/assignments"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-primary-hover)]"
                >
                  <ClipboardListIcon className="h-4 w-4" />
                  <span>View Pending Tasks</span>
                </Link>
                <Link
                  to="/student/timetable"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>Full Timetable</span>
                </Link>
              </div>
            </div>
          </Card>

          {/* 4 Summary KPI Cards */}
          <section aria-label="Academic summary statistics">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Enrolled Courses"
                value={data.enrolledCoursesCount}
                hint={`${data.profile.gradeName} curriculum`}
                icon={<BookOpenIcon className="h-5 w-5" />}
                tone="brand"
                to="/student/courses"
              />
              <StatCard
                label="Pending Assignments"
                value={data.pendingAssignmentsCount}
                hint={data.nextAssignmentHint}
                icon={<ClipboardListIcon className="h-5 w-5" />}
                tone="warning"
                to="/student/assignments"
              />
              <StatCard
                label="Upcoming Assessments"
                value={data.upcomingAssessmentsCount}
                hint={data.nextAssessmentHint}
                icon={<FileCheckIcon className="h-5 w-5" />}
                tone="info"
                to="/student/assessments"
              />
              <StatCard
                label="Attendance Rate"
                value={`${data.attendancePercentage}%`}
                hint={data.attendanceSummaryHint}
                icon={<CalendarCheckIcon className="h-5 w-5" />}
                tone="success"
                to="/student/attendance"
              />
            </div>
          </section>

          {/* Main Grid: Today's Timetable + Upcoming Deadlines */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Today's Timetable */}
            <Card className="lg:col-span-5">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Today&apos;s Timetable
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Thursday schedule</p>
                </div>
                <Link
                  to="/student/timetable"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  <span>Weekly view</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-2.5">
                {data.todaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border p-3 ${
                      slot.isCurrent
                        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)]'
                        : slot.isBreak
                          ? 'border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-raised)]'
                          : 'border-[var(--color-border-subtle)] bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--color-text-secondary)]">
                          {slot.startTime}–{slot.endTime}
                        </span>
                        {slot.isCurrent && <Badge variant="brand">In Progress</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {slot.subjectName}
                      </p>
                      {!slot.isBreak && (
                        <p className="text-xs text-[var(--color-text-muted)]">{slot.teacherName}</p>
                      )}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      {slot.classroom}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Upcoming Assignment Deadlines */}
            <Card className="lg:col-span-7">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Upcoming Assignment Deadlines
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Prioritized by closest submission date
                  </p>
                </div>
                <Link
                  to="/student/assignments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  <span>All assignments</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data.upcomingAssignments.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  All assigned tasks are submitted. Great momentum!
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.upcomingAssignments.map((assignment) => {
                    const statusMeta = ASSIGNMENT_STATUS_META[assignment.status];
                    return (
                      <div
                        key={assignment.id}
                        className="flex flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--color-brand-primary)]">
                              {assignment.subjectName}
                            </span>
                            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                          </div>
                          <Link
                            to={`/student/assignments/${assignment.id}`}
                            className="mt-1 block truncate text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] hover:underline"
                          >
                            {assignment.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                            {assignment.dueLabel} · {assignment.maxMarks} marks
                          </p>
                        </div>

                        <Link
                          to={`/student/assignments/${assignment.id}`}
                          className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                        >
                          Open task
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Continue Learning + Weekly Learning Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Continue Learning */}
            <Card className="lg:col-span-7">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Continue Learning
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Pick up right where you left off
                  </p>
                </div>
                <Link
                  to="/student/courses"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  <span>Browse courses</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {data.continueLearningCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-muted)]">
                          {course.subjectName} · {course.code}
                        </p>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          Next: {course.nextLessonTitle}
                        </p>
                      </div>
                      <Link
                        to={`/student/courses/${course.id}`}
                        className="inline-flex min-h-[34px] items-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary-subtle)] px-3 text-xs font-semibold text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-light)]"
                      >
                        Resume
                      </Link>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-brand-primary)]"
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {course.progressPercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Learning Activity Chart */}
            <Card className="lg:col-span-5">
              <ProgressChart
                title="Weekly Learning Activity"
                subtitle="Study minutes logged across the past 7 days"
                data={data.weeklyActivity.map((d) => ({
                  label: d.day,
                  value: d.minutesStudied,
                  secondaryLabel: `${d.tasksCompleted} tasks`,
                }))}
                maxValue={150}
                unit="m"
                barTone="brand"
              />
            </Card>
          </div>

          {/* Course Progress Overview + Announcements + Teacher Feedback */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Course Progress Overview */}
            <Card>
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Course Progress Overview
                </h2>
                <Link
                  to="/student/progress"
                  className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  Details
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {(allCourses ?? data.continueLearningCourses).map((course) => (
                  <div key={course.id}>
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        to={`/student/courses/${course.id}`}
                        className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]"
                      >
                        {course.subjectName}
                      </Link>
                      <span className="font-semibold text-[var(--color-text-secondary)]">
                        {course.progressPercent}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-brand-primary)]"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Recent Announcements
                </h2>
                <Link
                  to="/student/announcements"
                  className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentAnnouncements.map((ann) => (
                  <Link
                    key={ann.id}
                    to={`/student/announcements?notice=${encodeURIComponent(ann.id)}`}
                    className="block rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3 hover:bg-[var(--color-surface-canvas)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={ann.isRead ? 'neutral' : 'brand'}>
                        {ann.isRead ? 'Read' : 'New'}
                      </Badge>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {ann.authorName}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                      {ann.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                      {ann.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Recent Teacher Feedback */}
            <Card>
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Recent Teacher Feedback
                </h2>
                <Link
                  to="/student/progress"
                  className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  My Progress
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-brand-primary)]">
                        {fb.subjectName}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        <SparklesIcon className="h-3 w-3" />
                        {fb.highlightTag}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      &ldquo;{fb.comment}&rdquo;
                    </p>
                    <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                      — {fb.teacherName} · {fb.context}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
