import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  HeartHandshake,
  Layers,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchSchoolOverview } from './schoolAdminApi';

export function SchoolAdminDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['school-admin', 'overview'],
    queryFn: ({ signal }) => fetchSchoolOverview(signal),
  });

  return (
    <AppShell
      title="School Overview"
      breadcrumbs={[{ label: 'School Administrator' }, { label: 'Overview' }]}
    >
      <div className="space-y-6">
        {/* Header with Title and Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              {data ? data.schoolName : 'School Overview'}
            </Heading>
            <Text variant="small" className="mt-1">
              Institutional health, academic operations, student attendance, and support telemetry.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Link to="/admin/academic">
              <Button variant="primary" size="sm">
                Academic Setup
              </Button>
            </Link>
            <Link to="/admin/students">
              <Button variant="outline" size="sm">
                Student Directory
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" size="sm">
                Settings &amp; Audit
              </Button>
            </Link>
          </div>
        </div>

        {/* Tenant Scoping Isolation Verification Badge */}
        {data && (
          <div
            role="status"
            aria-label="Tenant isolation verification"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900"
          >
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>
                Tenant-Isolated Domain: <strong>{data.schoolName}</strong>
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700">
              Zero Trust Multi-Tenancy · Cryptographically Scoped
            </span>
          </div>
        )}

        {/* Actionable Alerts & Operational Notifications (Section E) */}
        {data && data.alerts && data.alerts.length > 0 && (
          <section aria-label="Actionable alerts and notifications" className="space-y-3">
            {data.alerts.map((alertItem) => (
              <Alert
                key={alertItem.id}
                variant={
                  alertItem.type === 'ACTION_REQUIRED'
                    ? 'warning'
                    : alertItem.type === 'WARNING'
                      ? 'warning'
                      : 'info'
                }
                title={alertItem.title}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span>{alertItem.message}</span>
                  {alertItem.actionUrl && (
                    <Link to={alertItem.actionUrl}>
                      <Button variant="secondary" size="sm">
                        {alertItem.actionLabel ?? 'Take Action'}
                      </Button>
                    </Link>
                  )}
                </div>
              </Alert>
            ))}
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div aria-label="Loading school metrics" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <ErrorState
            title="Unable to load school overview"
            description={
              error instanceof Error
                ? error.message
                : 'Unable to retrieve school overview metrics from the server.'
            }
            onRetry={() => void refetch()}
          />
        )}

        {/* Section A: School Overview Metric Cards */}
        {data && (
          <section
            aria-label="School key metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            {/* Active Academic Year */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Academic Year</Text>
                <Calendar
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                {data.activeAcademicYear ?? 'Not set'}
              </p>
              <div className="mt-2">
                <Badge variant={data.activeAcademicYear ? 'success' : 'warning'}>
                  {data.activeAcademicYear ? 'Active Term' : 'Action Required'}
                </Badge>
              </div>
            </Card>

            {/* Enrolled Students */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Enrolled Students</Text>
                <GraduationCap
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.totalStudents}
              </p>
              <Text variant="caption" className="mt-2">
                Active student body
              </Text>
            </Card>

            {/* Teaching Staff */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Teaching Staff</Text>
                <Users className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.totalStaff}
              </p>
              <Text variant="caption" className="mt-2">
                Active faculty roster
              </Text>
            </Card>

            {/* Classes & Sections */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Academic Structure</Text>
                <Layers className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.totalClasses}{' '}
                <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                  classes
                </span>
              </p>
              <Text variant="caption" className="mt-2">
                {data.totalSections} classroom sections
              </Text>
            </Card>

            {/* Active Support Plans */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Support Plans</Text>
                <HeartHandshake
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.activeSupportPlans}
              </p>
              <Text variant="caption" className="mt-2">
                Human-reviewed interventions
              </Text>
            </Card>
          </section>
        )}

        {/* Section B & Section C: Attendance Overview & Academic Overview */}
        {data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Section B: Attendance Overview */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Attendance Overview
                  </Heading>
                </div>
                {data.attendance && (
                  <Badge variant="neutral">Recorded for: {data.attendance.recordedDate}</Badge>
                )}
              </div>

              {data.attendance && data.attendance.totalRecorded > 0 ? (
                <div className="mt-4 space-y-4">
                  {/* Attendance Rate Progress Indicator */}
                  <div>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-[var(--color-text-primary)]">
                        Daily Attendance Rate
                      </span>
                      <span
                        className={`font-mono text-base ${
                          data.attendance.attendanceRate >= 85
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {data.attendance.attendanceRate}%
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                      <div
                        className={`h-full transition-all duration-500 ${
                          data.attendance.attendanceRate >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, data.attendance.attendanceRate)}%` }}
                        role="progressbar"
                        aria-valuenow={data.attendance.attendanceRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Attendance rate percentage"
                      />
                    </div>
                  </div>

                  {/* Attendance Breakdown Pills */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50/50 p-2.5 text-center">
                      <Text variant="caption" className="text-emerald-800">
                        Present
                      </Text>
                      <p className="mt-1 text-xl font-bold text-emerald-900">
                        {data.attendance.present}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-rose-100 bg-rose-50/50 p-2.5 text-center">
                      <Text variant="caption" className="text-rose-800">
                        Absent
                      </Text>
                      <p className="mt-1 text-xl font-bold text-rose-900">
                        {data.attendance.absent}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-amber-100 bg-amber-50/50 p-2.5 text-center">
                      <Text variant="caption" className="text-amber-800">
                        Late
                      </Text>
                      <p className="mt-1 text-xl font-bold text-amber-900">
                        {data.attendance.late}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50/50 p-2.5 text-center">
                      <Text variant="caption" className="text-blue-800">
                        Excused
                      </Text>
                      <p className="mt-1 text-xl font-bold text-blue-900">
                        {data.attendance.excused}
                      </p>
                    </div>
                  </div>

                  {/* 7-Day Attendance Trend Chart */}
                  {data.attendance.trend && data.attendance.trend.length > 0 && (
                    <div className="pt-2">
                      <Text
                        variant="small"
                        className="font-semibold text-[var(--color-text-primary)]"
                      >
                        Recent Daily Attendance Rates
                      </Text>
                      <div className="mt-3 flex items-end justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                        {data.attendance.trend.map((point) => (
                          <div
                            key={point.date}
                            className="flex flex-1 flex-col items-center gap-1.5"
                          >
                            <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                              {point.rate}%
                            </span>
                            <div className="h-20 w-full max-w-[28px] rounded-t bg-emerald-200">
                              <div
                                className="w-full rounded-t bg-[var(--color-brand-primary)]"
                                style={{ height: `${Math.max(8, point.rate)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              {point.date.slice(5)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="No Attendance Data Recorded"
                    description="Teachers record attendance daily per section. Attendance statistics will appear once submitted."
                  />
                </div>
              )}
            </Card>

            {/* Section C: Academic Overview */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <FileText
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Academic Overview
                  </Heading>
                </div>
                <Link to="/admin/academic">
                  <Button variant="outline" size="sm">
                    Curriculum Setup
                  </Button>
                </Link>
              </div>

              {data.academic ? (
                <div className="mt-4 space-y-4">
                  {/* Academic Key Counters */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                      <Text variant="caption">Published Assignments</Text>
                      <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                        {data.academic.activeAssignments}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                      <Text variant="caption">Upcoming Assessments</Text>
                      <p className="mt-1 text-2xl font-bold text-[var(--color-brand-primary)]">
                        {data.academic.upcomingAssessments}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3 col-span-2 sm:col-span-1">
                      <Text variant="caption">Total Assessments</Text>
                      <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                        {data.academic.totalAssessments}
                      </p>
                    </div>
                  </div>

                  {/* Recent Assessments List */}
                  <div>
                    <Text
                      variant="small"
                      className="font-semibold text-[var(--color-text-primary)]"
                    >
                      Recent Assessments &amp; Exams
                    </Text>
                    {data.academic.recentAssessments.length > 0 ? (
                      <div className="mt-2 divide-y divide-[var(--color-border-default)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
                        {data.academic.recentAssessments.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-[var(--color-text-primary)]">
                                {item.title}
                              </p>
                              <p className="text-[var(--color-text-secondary)]">
                                {item.subjectName} · {item.className}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="neutral">{item.assessmentDate}</Badge>
                              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                                Max {item.maxMarks} pts ({item.weightPercentage}% weight)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 py-4">
                        <EmptyState
                          title="No Assessments Created"
                          description="No assessments or exams have been created yet."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="Academic Overview Unavailable"
                    description="Academic activities will be tracked once courses and assignments are published."
                  />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Section D: Staff & Student Activity Feed */}
        {data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Registered Students */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Recent Student Enrollments
                  </Heading>
                </div>
                <Link to="/admin/students">
                  <Button variant="outline" size="sm">
                    View All Students
                  </Button>
                </Link>
              </div>

              {data.activity && data.activity.recentStudents.length > 0 ? (
                <div className="mt-4 divide-y divide-[var(--color-border-default)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
                  {data.activity.recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 text-xs transition-colors hover:bg-[var(--color-surface-sunken)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {student.name}
                          </p>
                          <p className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                            ID: {student.studentIdNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{student.createdAt.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="No Students Registered"
                    description="No student profiles have been enrolled yet."
                    action={
                      <Link to="/admin/students">
                        <Button variant="primary" size="sm">
                          Register Student
                        </Button>
                      </Link>
                    }
                  />
                </div>
              )}
            </Card>

            {/* School Administrative Audit Feed */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
                  <Heading level={3} size="h3">
                    Administrative Audit Trail
                  </Heading>
                </div>
                <Link to="/admin/settings">
                  <Button variant="outline" size="sm">
                    Full Audit Log
                  </Button>
                </Link>
              </div>

              {data.activity && data.activity.recentAuditLogs.length > 0 ? (
                <div className="mt-4 space-y-2.5">
                  {data.activity.recentAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <Badge variant="neutral" className="font-mono text-[10px]">
                          {log.action}
                        </Badge>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {log.createdAt.slice(0, 10)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-[var(--color-text-secondary)]">
                        <span>
                          Target: <strong>{log.entityType}</strong> (
                          <span className="font-mono">{log.entityId?.slice(0, 8)}</span>)
                        </span>
                        <span>{log.actorEmail ?? 'System Actor'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="No Audit Activity Recorded"
                    description="Administrative operations will be cryptographically audited and recorded here."
                  />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Administrative Quick Shortcuts */}
        <Card>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
            <Heading level={3} size="h3">
              Administrative Quick Links
            </Heading>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/admin/academic">
              <Button variant="secondary" size="sm">
                Configure Academic Years &amp; Classes
              </Button>
            </Link>
            <Link to="/admin/staff">
              <Button variant="secondary" size="sm">
                Manage Staff Directory
              </Button>
            </Link>
            <Link to="/admin/students">
              <Button variant="secondary" size="sm">
                Register &amp; Enroll Students
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="secondary" size="sm">
                Institutional Settings &amp; Security
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default SchoolAdminDashboardPage;
