import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, GraduationCap, HeartHandshake, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Button, Card, ErrorState, Heading, Skeleton, Text } from '@/components/ui';
import { fetchSchoolOverview } from './schoolAdminApi';

export function SchoolAdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['school-admin', 'overview'],
    queryFn: ({ signal }) => fetchSchoolOverview(signal),
  });

  return (
    <AppShell
      title="School Overview"
      breadcrumbs={[{ label: 'School Administrator' }, { label: 'Overview' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              {data ? data.schoolName : 'Institutional Health Overview'}
            </Heading>
            <Text variant="small" className="mt-1">
              Academic structure, staffing, student enrollment, and support overview.
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/academic">
              <Button variant="primary">Academic Setup</Button>
            </Link>
            <Link to="/admin/students">
              <Button variant="outline">Student Directory</Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline">Settings &amp; Audit</Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div
            aria-label="Loading school metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {isError && (
          <ErrorState
            title="Unable to load school overview"
            description={error instanceof Error ? error.message : 'Unable to reach school metrics.'}
            onRetry={() => void refetch()}
          />
        )}

        {data && (
          <section
            aria-label="School key metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Active Academic Year</Text>
                <Calendar
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-lg font-bold text-[var(--color-text-primary)]">
                {data.activeAcademicYear ?? 'Not set'}
              </p>
              <div className="mt-2">
                <Badge variant={data.activeAcademicYear ? 'success' : 'warning'}>
                  {data.activeAcademicYear ? 'Active Term' : 'Action Required'}
                </Badge>
              </div>
            </Card>

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
                {data.totalClasses} classes · {data.totalSections} sections
              </Text>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Teaching Staff</Text>
                <Users className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.totalStaff}
              </p>
              <Text variant="caption" className="mt-2">
                Active faculty directory
              </Text>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Active Support Plans</Text>
                <HeartHandshake
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.activeSupportPlans}
              </p>
              <Text variant="caption" className="mt-2">
                Human-reviewed student support
              </Text>
            </Card>
          </section>
        )}

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
                Manage Staff Accounts
              </Button>
            </Link>
            <Link to="/admin/students">
              <Button variant="secondary" size="sm">
                Register &amp; Enroll Students
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default SchoolAdminDashboardPage;
