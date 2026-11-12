import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, Building2, ShieldAlert, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Button, Card, ErrorState, Heading, Skeleton, Text } from '@/components/ui';
import { fetchPlatformOverview } from './superAdminApi';

export function SuperAdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['super-admin', 'overview'],
    queryFn: ({ signal }) => fetchPlatformOverview(signal),
  });

  return (
    <AppShell
      title="Platform Overview"
      breadcrumbs={[{ label: 'Platform Super Admin' }, { label: 'Overview' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Platform Operations &amp; Health
            </Heading>
            <Text variant="small" className="mt-1">
              Multi-tenant school provisioning, active tenant counts, and audit telemetry.
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/super-admin/schools">
              <Button variant="primary">Manage Schools</Button>
            </Link>
            <Link to="/super-admin/governance">
              <Button variant="outline">Security Stream</Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div
            aria-label="Loading platform metrics"
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
            title="Unable to load platform overview"
            description={error instanceof Error ? error.message : 'Telemetry service unavailable.'}
            onRetry={() => void refetch()}
          />
        )}

        {data && (
          <section
            aria-label="Platform key metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Total School Tenants</Text>
                <Building2
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.totalSchools}
              </p>
              <div className="mt-2">
                <Badge variant="success">{data.activeSchools} Active</Badge>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Suspended Tenants</Text>
                <ShieldAlert
                  className="h-5 w-5 text-[var(--color-semantic-warning-fg)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.suspendedSchools}
              </p>
              <Text variant="caption" className="mt-2">
                Requires governance review
              </Text>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Platform Users</Text>
                <Users className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.totalUsers}
              </p>
              <Text variant="caption" className="mt-2">
                Across all active institutions
              </Text>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Audit Events</Text>
                <Activity
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.recentAuditEvents}
              </p>
              <Text variant="caption" className="mt-2">
                Immutable security trail
              </Text>
            </Card>
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default SuperAdminDashboardPage;
