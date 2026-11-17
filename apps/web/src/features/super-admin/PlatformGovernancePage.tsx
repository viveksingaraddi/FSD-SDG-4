import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, RefreshCw, ShieldCheck } from 'lucide-react';
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
  Input,
  Text,
} from '@/components/ui';
import { fetchPlatformAuditLogs } from './superAdminApi';

type AuditCategory = 'ALL' | 'AUTH' | 'SCHOOL' | 'ACADEMIC' | 'USER' | 'SETTINGS';

function getCategoryBadge(action: string) {
  if (action.includes('AUTH_') || action.includes('PASSWORD') || action.includes('SESSION')) {
    return <Badge variant="danger">Security / Auth</Badge>;
  }
  if (
    action.includes('TENANT') ||
    action.includes('SCHOOL_CREATED') ||
    action.includes('PROVISIONED')
  ) {
    return <Badge variant="success">Provisioning</Badge>;
  }
  if (
    action.includes('ACADEMIC') ||
    action.includes('CLASS') ||
    action.includes('SECTION') ||
    action.includes('SUBJECT')
  ) {
    return <Badge variant="brand">Academic</Badge>;
  }
  if (
    action.includes('USER_') ||
    action.includes('INVITATION_') ||
    action.includes('STUDENT') ||
    action.includes('TEACHER')
  ) {
    return <Badge variant="info">User Account</Badge>;
  }
  return <Badge variant="neutral">Governance</Badge>;
}

export function PlatformGovernancePage() {
  const [actionFilter, setActionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['super-admin', 'audit-logs', actionFilter, categoryFilter, startDate, endDate],
    queryFn: ({ signal }) =>
      fetchPlatformAuditLogs(
        {
          action: actionFilter.trim() || undefined,
          category: categoryFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        signal,
      ),
  });

  const logs = data ?? [];

  const columns: DataTableColumn<AuditLogDto>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Event Category',
      render: (row) => getCategoryBadge(row.action),
    },
    {
      key: 'action',
      header: 'Action Name',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (row) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {row.entityType} ({row.entityId.slice(0, 8)}...)
        </span>
      ),
    },
    {
      key: 'tenant',
      header: 'Tenant Scope',
      render: (row) => (
        <span className="text-xs font-mono text-[var(--color-text-muted)]">
          {row.schoolId ? `${row.schoolId.slice(0, 8)}...` : 'Platform Global'}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <span className="text-xs text-[var(--color-text-primary)]">
          {row.actorEmail ?? 'System Agent'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspector',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedLog(row)}
          aria-label={`Inspect event ${row.action}`}
          leftIcon={<Eye className="h-3.5 w-3.5" />}
        >
          View Payload
        </Button>
      ),
    },
  ];

  return (
    <AppShell
      title="Platform Security Stream"
      breadcrumbs={[
        { label: 'Platform Super Admin', to: '/super-admin' },
        { label: 'Governance & Security' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Cross-Tenant Audit &amp; Security Stream
            </Heading>
            <Text variant="small" className="mt-1">
              Immutable security, account lifecycle, and institutional provisioning events.
            </Text>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh Stream
          </Button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border-default)] pb-2">
          {(
            [
              { key: 'ALL', label: 'All Security Events' },
              { key: 'AUTH', label: 'Auth & Security' },
              { key: 'SCHOOL', label: 'School Provisioning' },
              { key: 'ACADEMIC', label: 'Academic & Curriculum' },
              { key: 'USER', label: 'User Accounts' },
              { key: 'SETTINGS', label: 'Settings & Policy' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategoryFilter(tab.key)}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === tab.key
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <Card padding="sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="audit-action-search"
                className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
              >
                Search Action
              </label>
              <Input
                id="audit-action-search"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="e.g. AUTH, SCHOOL, USER..."
              />
            </div>
            <div>
              <label
                htmlFor="audit-start-date"
                className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
              >
                From Date
              </label>
              <Input
                id="audit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="audit-end-date"
                className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
              >
                To Date
              </label>
              <Input
                id="audit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionFilter('');
                  setCategoryFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Event List Table */}
        {isError ? (
          <ErrorState
            title="Unable to load security stream"
            description={error instanceof Error ? error.message : 'Stream unavailable.'}
            onRetry={() => void refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="Platform audit events"
            loading={isLoading}
            rows={logs}
            getRowKey={(row) => row.id}
            emptyTitle="No security incidents or audit records recorded"
            emptyDescription="No events match your current filter parameters."
            columns={columns}
          />
        )}

        {/* Inspector Payload Drawer / Modal */}
        {selectedLog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-inspector-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-brand-primary)]" />
                  <Heading level={3} size="h3" id="log-inspector-title">
                    Audit Event Payload
                  </Heading>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                  aria-label="Close inspector"
                >
                  Close
                </Button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">
                      Action:
                    </span>
                    <p className="font-mono text-[var(--color-text-primary)]">
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">
                      Entity:
                    </span>
                    <p className="font-mono text-[var(--color-text-primary)]">
                      {selectedLog.entityType} ({selectedLog.entityId})
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">Actor:</span>
                    <p className="text-[var(--color-text-primary)]">
                      {selectedLog.actorEmail ?? 'System Agent'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">
                      Timestamp:
                    </span>
                    <p className="text-[var(--color-text-primary)]">
                      {new Date(selectedLog.createdAt).toISOString()}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-[var(--color-text-secondary)]">
                    Audit Delta Payload (Sanitized):
                  </span>
                  <pre className="mt-1 max-h-48 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3 font-mono text-[11px] text-[var(--color-text-primary)]">
                    {selectedLog.delta
                      ? JSON.stringify(selectedLog.delta, null, 2)
                      : '// No mutation payload captured'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default PlatformGovernancePage;
