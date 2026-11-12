import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, ErrorState, Heading, SearchInput, Text } from '@/components/ui';
import { fetchPlatformAuditLogs } from './superAdminApi';

export function PlatformGovernancePage() {
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['super-admin', 'audit-logs', actionFilter],
    queryFn: ({ signal }) => fetchPlatformAuditLogs(actionFilter, signal),
  });

  return (
    <AppShell
      title="Platform Security Stream"
      breadcrumbs={[{ label: 'Platform Super Admin', to: '/super-admin' }, { label: 'Governance' }]}
    >
      <div className="space-y-5">
        <div>
          <Heading level={2} size="h2">
            Cross-Tenant Audit &amp; Security Stream
          </Heading>
          <Text variant="small" className="mt-1">
            Immutable security and provisioning events across the platform.
          </Text>
        </div>

        <SearchInput
          value={actionFilter}
          onChange={setActionFilter}
          label="Filter audit events by action"
          placeholder="Filter by action (e.g. AUTH, SCHOOL)..."
          className="max-w-md"
        />

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
            rows={data ?? []}
            getRowKey={(row) => row.id}
            emptyTitle="No security incidents recorded"
            emptyDescription="No audit events matched your current filter."
            columns={[
              {
                key: 'action',
                header: 'Action',
                render: (row) => <Badge variant="neutral">{row.action}</Badge>,
              },
              {
                key: 'entity',
                header: 'Entity',
                render: (row) => (
                  <span className="text-sm">
                    {row.entityType} ({row.entityId.slice(0, 8)})
                  </span>
                ),
              },
              {
                key: 'actor',
                header: 'Actor',
                render: (row) => row.actorEmail ?? 'System',
              },
              {
                key: 'timestamp',
                header: 'Timestamp',
                render: (row) => (
                  <time dateTime={row.createdAt} className="text-xs text-[var(--color-text-muted)]">
                    {new Date(row.createdAt).toLocaleString()}
                  </time>
                ),
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}

export default PlatformGovernancePage;
