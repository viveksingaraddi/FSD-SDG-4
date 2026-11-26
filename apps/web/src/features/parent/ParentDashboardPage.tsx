import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Skeleton,
  Text,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { QuickNavigationCard } from './components/QuickNavigationCard';
import {
  fetchChildAssignments,
  fetchChildSupportPlans,
  fetchParentOverview,
} from './parentApi';

export function ParentDashboardPage() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['parent', 'overview'],
    queryFn: ({ signal }) => fetchParentOverview(signal),
  });

  const children = data?.children ?? [];
  const activeChild = children.find((c) => c.id === selectedChildId) ?? children[0] ?? null;

  const assignmentsQuery = useQuery({
    queryKey: ['parent', 'assignments', activeChild?.id ?? ''],
    queryFn: ({ signal }) => fetchChildAssignments(activeChild!.id, signal),
    enabled: Boolean(activeChild?.id),
  });

  const supportPlansQuery = useQuery({
    queryKey: ['parent', 'support-plans', activeChild?.id ?? ''],
    queryFn: ({ signal }) => fetchChildSupportPlans(activeChild!.id, signal),
    enabled: Boolean(activeChild?.id),
  });

  const upcomingAssignments = (assignmentsQuery.data?.assignments ?? [])
    .filter((a) => a.status === 'PENDING' || a.status === 'OVERDUE')
    .slice(0, 3);

  const homeActivities = (supportPlansQuery.data ?? [])
    .flatMap((p) => p.actionItems.filter((i) => i.isHomeAction && i.status !== 'COMPLETED'))
    .slice(0, 3);

  const welcomeName = user?.email ?? data?.guardianName ?? 'Parent / Guardian';

  return (
    <AppShell
      title="Family Overview"
      breadcrumbs={[{ label: 'Parent / Guardian' }, { label: 'Family Overview' }]}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Welcome, {welcomeName}
            </Heading>
            <Text variant="small" className="mt-1">
              Monitor your verified children&apos;s attendance, academic progress, assignments, and
              support plans.
            </Text>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4" role="status" aria-label="Loading family overview">
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <ErrorState
            title="Unable to load family overview"
            description={
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred while loading your family dashboard.'
            }
            onRetry={() => void refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Your guardian account does not have any verified student links yet. Please contact your school administrator to verify your guardian relationship."
          />
        )}

        {/* Loaded Content */}
        {!isLoading && !isError && activeChild && (
          <div className="space-y-6">
            {/* Child Selector */}
            {children.length > 1 && (
              <div
                role="tablist"
                aria-label="Select linked child"
                className="flex flex-wrap items-center gap-2"
              >
                <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Linked Children:
                </span>
                {children.map((child) => {
                  const isSelected = child.id === activeChild.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedChildId(child.id)}
                      className={[
                        'min-h-[40px] rounded-[var(--radius-md)] border px-3.5 py-1.5 text-sm font-medium transition-colors',
                        isSelected
                          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]'
                          : 'border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)]',
                      ].join(' ')}
                    >
                      {child.firstName} {child.lastName} ({child.className} · {child.sectionName})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Child Profile Card */}
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar name={`${activeChild.firstName} ${activeChild.lastName}`} size="lg" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Heading level={3} size="h3">
                        {activeChild.firstName} {activeChild.lastName}
                      </Heading>
                      <Badge variant="brand">{activeChild.relationshipType}</Badge>
                      {activeChild.isPrimaryContact && (
                        <Badge variant="success">
                          <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                          Primary Contact
                        </Badge>
                      )}
                    </div>
                    <Text variant="small" className="mt-1">
                      Student ID: <span className="font-mono">{activeChild.studentIdNumber}</span>
                    </Text>
                  </div>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  <strong>{activeChild.className}</strong> · Section {activeChild.sectionName}
                </div>
              </div>
            </Card>

            {/* Primary Metrics Row */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                    <Heading level={3} size="h3">
                      Attendance
                    </Heading>
                  </div>
                  <Badge
                    variant={
                      activeChild.attendanceRate >= 90
                        ? 'success'
                        : activeChild.attendanceRate >= 75
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {activeChild.attendanceRate}%
                  </Badge>
                </div>
                <Text variant="small" className="mt-2">
                  Unexcused absences: <strong>{activeChild.unexcusedAbsenceCount}</strong>
                </Text>
                <div className="mt-4">
                  <Link to="/parent/attendance">
                    <Button variant="outline" size="sm">
                      View Attendance
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                    <Heading level={3} size="h3">
                      Academic Progress
                    </Heading>
                  </div>
                  <Badge variant="neutral">{activeChild.recentGradesCount} results</Badge>
                </div>
                <Text variant="small" className="mt-2">
                  Published assessment results and coursework feedback.
                </Text>
                <div className="mt-4">
                  <Link to="/parent/progress">
                    <Button variant="outline" size="sm">
                      View Progress
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartHandshake
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                    <Heading level={3} size="h3">
                      Support Plans
                    </Heading>
                  </div>
                  <Badge variant={activeChild.activeSupportPlanCount > 0 ? 'brand' : 'neutral'}>
                    {activeChild.activeSupportPlanCount} active
                  </Badge>
                </div>
                <Text variant="small" className="mt-2">
                  Approved family &amp; student support plans.
                </Text>
                <div className="mt-4">
                  <Link to="/parent/support">
                    <Button variant="outline" size="sm">
                      View Support Plans
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Assignments & Home Activities Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                    <Heading level={3} size="h3">
                      Upcoming Assignments
                    </Heading>
                  </div>
                  <Link to="/parent/assignments">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                {upcomingAssignments.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    No pending or overdue assignments right now.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-[var(--color-border-default)]">
                    {upcomingAssignments.map((a) => (
                      <li
                        key={a.assignmentId}
                        className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {a.subjectName} · Due {a.dueDate}
                          </p>
                        </div>
                        <Badge variant={a.status === 'OVERDUE' ? 'danger' : 'warning'}>
                          {a.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HeartHandshake
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                    <Heading level={3} size="h3">
                      Parent-Assisted Home Activities
                    </Heading>
                  </div>
                  <Link to="/parent/assignments">
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
                {homeActivities.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    No pending home-support activities assigned.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-[var(--color-border-default)]">
                    {homeActivities.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.description}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Due {item.dueDate}
                          </p>
                        </div>
                        <Badge variant="neutral">{item.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* Secondary Portal Modules Summary */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  <Heading level={4} size="h4">
                    Calendar Events
                  </Heading>
                </div>
                <Text variant="small" className="mt-1.5">
                  View upcoming academic dates and deadlines.
                </Text>
                <div className="mt-3">
                  <Link to="/parent/calendar">
                    <Button variant="outline" size="sm">
                      Open Calendar
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  <Heading level={4} size="h4">
                    Teacher Messages
                  </Heading>
                </div>
                <Text variant="small" className="mt-1.5">
                  Messaging backend pending provisioning.
                </Text>
                <div className="mt-3">
                  <Link to="/parent/messages">
                    <Button variant="outline" size="sm">
                      Open Messages
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  <Heading level={4} size="h4">
                    Notifications
                  </Heading>
                </div>
                <Text variant="small" className="mt-1.5">
                  Notification center pending backend feed.
                </Text>
                <div className="mt-3">
                  <Link to="/parent/notifications">
                    <Button variant="outline" size="sm">
                      Open Notifications
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  <Heading level={4} size="h4">
                    Fees &amp; Documents
                  </Heading>
                </div>
                <Text variant="small" className="mt-1.5">
                  Review fee status &amp; published reports.
                </Text>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/parent/fees">
                    <Button variant="outline" size="sm">
                      Fees
                    </Button>
                  </Link>
                  <Link to="/parent/documents">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      Docs
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Quick Navigation */}
            <QuickNavigationCard />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ParentDashboardPage;
