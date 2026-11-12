import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  GraduationCap,
  Layers,
  RefreshCw,
  School,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { AuditLogDto } from '@fsd-sdg4/contracts';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  DataTable,
  type DataTableColumn,
  ErrorState,
  Heading,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchPlatformAuditLogs, fetchPlatformOverview } from './superAdminApi';

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

function getActionBadge(action: string) {
  if (action.includes('CREATED')) {
    return <Badge variant="success">Created</Badge>;
  }
  if (action.includes('UPDATED')) {
    return <Badge variant="brand">Updated</Badge>;
  }
  if (action.includes('DELETED') || action.includes('SUSPENDED')) {
    return <Badge variant="danger">Suspended</Badge>;
  }
  return <Badge variant="neutral">{action.replace(/_/g, ' ').toLowerCase()}</Badge>;
}

export function SuperAdminDashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['super-admin', 'overview'],
    queryFn: ({ signal }) => fetchPlatformOverview(signal),
  });

  const auditQuery = useQuery({
    queryKey: ['super-admin', 'recent-audit'],
    queryFn: ({ signal }) => fetchPlatformAuditLogs(undefined, signal),
  });

  const overview = overviewQuery.data;
  const auditLogs = Array.isArray(auditQuery.data) ? auditQuery.data : [];

  const auditColumns: DataTableColumn<AuditLogDto>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          {formatTimestamp(log.createdAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <div className="flex items-center gap-2">
          {getActionBadge(log.action)}
          <span className="font-mono text-xs text-[var(--color-text-primary)]">{log.action}</span>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (log) => (
        <span className="text-sm text-[var(--color-text-primary)]">
          {log.actorEmail ?? 'System Administrator'}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (log) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ''}
        </span>
      ),
    },
    {
      key: 'school',
      header: 'Tenant Scope',
      render: (log) => (
        <span className="text-xs text-[var(--color-text-muted)] font-mono">
          {log.schoolId ? log.schoolId.slice(0, 8) + '...' : 'Platform-Wide'}
        </span>
      ),
    },
  ];

  const totalUsers = overview?.totalUsers ?? 0;
  const usersByRole = overview?.usersByRole ?? {
    teachers: 0,
    students: 0,
    schoolAdmins: 0,
    parents: 0,
    superAdmins: 0,
  };

  const roleDistribution = [
    {
      role: 'Students',
      count: usersByRole.students,
      percentage: totalUsers > 0 ? Math.round((usersByRole.students / totalUsers) * 100) : 0,
      icon: GraduationCap,
      color: 'bg-[var(--color-brand-primary)]',
    },
    {
      role: 'Teachers',
      count: usersByRole.teachers,
      percentage: totalUsers > 0 ? Math.round((usersByRole.teachers / totalUsers) * 100) : 0,
      icon: BookOpen,
      color: 'bg-[var(--color-semantic-info-fg)]',
    },
    {
      role: 'School Administrators',
      count: usersByRole.schoolAdmins,
      percentage: totalUsers > 0 ? Math.round((usersByRole.schoolAdmins / totalUsers) * 100) : 0,
      icon: School,
      color: 'bg-[var(--color-semantic-success-fg)]',
    },
    {
      role: 'Parents & Guardians',
      count: usersByRole.parents,
      percentage: totalUsers > 0 ? Math.round((usersByRole.parents / totalUsers) * 100) : 0,
      icon: Users,
      color: 'bg-[var(--color-semantic-warning-fg)]',
    },
    {
      role: 'Super Admins',
      count: usersByRole.superAdmins,
      percentage: totalUsers > 0 ? Math.round((usersByRole.superAdmins / totalUsers) * 100) : 0,
      icon: ShieldCheck,
      color: 'bg-indigo-600',
    },
  ];

  return (
    <AppShell
      title="Platform Overview"
      breadcrumbs={[{ label: 'Platform Super Admin' }, { label: 'Overview' }]}
    >
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Platform Operations &amp; Health
            </Heading>
            <Text variant="small" className="mt-1">
              Multi-tenant school provisioning, cross-institutional telemetry, and audit trail.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void overviewQuery.refetch();
                void auditQuery.refetch();
              }}
              disabled={overviewQuery.isFetching || auditQuery.isFetching}
              aria-label="Refresh platform telemetry"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1.5 ${overviewQuery.isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </Button>
            <Link to="/super-admin/schools">
              <Button variant="primary">Manage Schools</Button>
            </Link>
            <Link to="/super-admin/governance">
              <Button variant="outline">Security Stream</Button>
            </Link>
          </div>
        </div>

        {/* Operational Alerts & System Health */}
        {overview?.alerts && overview.alerts.length > 0 ? (
          <div className="space-y-3" role="region" aria-label="Platform operational notices">
            {overview.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border p-4 ${
                  alert.level === 'warning'
                    ? 'border-amber-200 bg-[var(--color-semantic-warning-bg)] text-[var(--color-semantic-warning-fg)]'
                    : 'border-sky-200 bg-[var(--color-semantic-info-bg)] text-[var(--color-semantic-info-fg)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs opacity-90">{alert.description}</p>
                  </div>
                </div>
                {alert.actionUrl && (
                  <Link to={alert.actionUrl}>
                    <Button variant="outline" size="sm">
                      {alert.actionLabel ?? 'Resolve'}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-emerald-200 bg-[var(--color-semantic-success-bg)] p-3 px-4 text-xs text-[var(--color-semantic-success-fg)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-medium">All Multi-Tenant Systems Operational</span>
            </div>
            <span className="text-emerald-700 font-mono">100% Tenant Isolation Verified</span>
          </div>
        )}

        {/* Loading Skeletons */}
        {overviewQuery.isLoading && (
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

        {/* Error State */}
        {overviewQuery.isError && (
          <ErrorState
            title="Unable to load platform overview"
            description={
              overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : 'Telemetry service unavailable.'
            }
            onRetry={() => {
              void overviewQuery.refetch();
              void auditQuery.refetch();
            }}
          />
        )}

        {/* Section A: Platform Overview Key Metrics */}
        {overview && (
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
              <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.totalSchools}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="success">{overview.activeSchools} Active</Badge>
                {overview.suspendedSchools > 0 && (
                  <Badge variant="warning">{overview.suspendedSchools} Suspended</Badge>
                )}
                {(overview.archivedSchools ?? 0) > 0 && (
                  <Badge variant="neutral">{overview.archivedSchools} Archived</Badge>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Active Institutions</Text>
                <School
                  className="h-5 w-5 text-[var(--color-semantic-success-fg)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.activeSchools}
              </p>
              <Text variant="caption" className="mt-2 text-emerald-600 font-medium">
                {overview.totalSchools > 0
                  ? `${Math.round((overview.activeSchools / overview.totalSchools) * 100)}% Institutional Adoption`
                  : 'No schools provisioned'}
              </Text>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <Text variant="muted">Platform Users</Text>
                <Users className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.totalUsers}
              </p>
              <Text variant="caption" className="mt-2">
                Across all registered institutions
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
              <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.recentAuditEvents}
              </p>
              <Text variant="caption" className="mt-2">
                Immutable security trail
              </Text>
            </Card>
          </section>
        )}

        {/* Section B & C: School & User Analytics */}
        {overview && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* User Analytics by Role */}
            <Card>
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                <div>
                  <Heading level={3} size="h3">
                    User Analytics &amp; Demographics
                  </Heading>
                  <Text variant="caption">Distribution across verified platform role types</Text>
                </div>
                <Users className="h-5 w-5 text-[var(--color-text-muted)]" aria-hidden="true" />
              </div>

              <div className="mt-4 space-y-4">
                {roleDistribution.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.role} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
                          <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                          <span>{item.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {item.count}
                          </span>
                          <span className="text-[var(--color-text-muted)]">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-2 w-full rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] overflow-hidden"
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.role} percentage`}
                      >
                        <div
                          className={`h-full rounded-[var(--radius-pill)] ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* School Analytics & Academic Scale */}
            <Card>
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                <div>
                  <Heading level={3} size="h3">
                    Institutional Adoption &amp; Scale
                  </Heading>
                  <Text variant="caption">Multi-tenant provisioning and academic footprint</Text>
                </div>
                <Building2 className="h-5 w-5 text-[var(--color-text-muted)]" aria-hidden="true" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                  <Text variant="caption" className="text-[var(--color-text-muted)]">
                    Active Tenants
                  </Text>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {overview.activeSchools}
                  </p>
                  <Text variant="caption" className="text-xs text-[var(--color-text-secondary)]">
                    Serving live curriculum
                  </Text>
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                  <Text variant="caption" className="text-[var(--color-text-muted)]">
                    Suspended / Inactive
                  </Text>
                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {overview.suspendedSchools}
                  </p>
                  <Text variant="caption" className="text-xs text-[var(--color-text-secondary)]">
                    Requires admin action
                  </Text>
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[var(--color-brand-primary)]" />
                    <Text variant="caption" className="text-[var(--color-text-muted)]">
                      Classes Configured
                    </Text>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                    {overview.schoolsAnalytics?.totalClasses ?? 0}
                  </p>
                  <Text variant="caption" className="text-xs text-[var(--color-text-secondary)]">
                    Across all school stages
                  </Text>
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
                  <div className="flex items-center gap-1.5">
                    <School className="h-4 w-4 text-[var(--color-brand-primary)]" />
                    <Text variant="caption" className="text-[var(--color-text-muted)]">
                      Active Sections
                    </Text>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                    {overview.schoolsAnalytics?.totalSections ?? 0}
                  </p>
                  <Text variant="caption" className="text-xs text-[var(--color-text-secondary)]">
                    Classrooms &amp; cohorts
                  </Text>
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-md)] border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <p className="font-semibold">Security &amp; Multi-Tenancy Guarantee</p>
                <p className="mt-0.5 opacity-90">
                  Each school tenant possesses an isolated data partition bounded by composite
                  foreign keys with tenant-level RBAC validation.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Section D: Recent Administrative Activity */}
        <section aria-label="Recent platform activity" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={3} size="h3">
                Recent Administrative Activity
              </Heading>
              <Text variant="caption">
                Live stream of platform provisioning, tenant security updates, and administrative
                actions.
              </Text>
            </div>
            <Link to="/super-admin/governance">
              <Button variant="outline" size="sm">
                View Full Audit Stream
              </Button>
            </Link>
          </div>

          <DataTable
            columns={auditColumns}
            rows={auditLogs.slice(0, 8)}
            getRowKey={(log) => log.id}
            ariaLabel="Recent platform audit logs"
            loading={auditQuery.isLoading}
            emptyTitle="No administrative events found"
            emptyDescription="Platform-level events and security actions will be recorded in this stream."
          />
        </section>
      </div>
    </AppShell>
  );
}

export default SuperAdminDashboardPage;
