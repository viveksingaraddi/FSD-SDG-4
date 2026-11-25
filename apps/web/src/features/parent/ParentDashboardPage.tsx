import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
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
import { fetchParentOverview } from './parentApi';

export function ParentDashboardPage() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['parent', 'overview'],
    queryFn: ({ signal }) => fetchParentOverview(signal),
  });

  const children = data?.children ?? [];
  const activeChild =
    children.find((c) => c.id === selectedChildId) ?? children[0] ?? null;

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
              Monitor your verified children&apos;s attendance, academic progress, and active
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

            {/* Key Metrics Grid */}
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
                      Published Grades
                    </Heading>
                  </div>
                  <Badge variant="neutral">{activeChild.recentGradesCount} results</Badge>
                </div>
                <Text variant="small" className="mt-2">
                  Review published assessments and coursework feedback.
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

            {/* Quick Navigation */}
            <QuickNavigationCard />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ParentDashboardPage;
