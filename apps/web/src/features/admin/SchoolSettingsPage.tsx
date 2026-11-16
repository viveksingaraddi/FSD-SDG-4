import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Filter,
  Globe,
  Layers,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { AuditLogDto } from '@fsd-sdg4/contracts';
import { updateSchoolSettingsSchema, type UpdateSchoolSettingsInput } from '@fsd-sdg4/validation';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  DataTable,
  type DataTableColumn,
  ErrorState,
  FormField,
  Heading,
  Input,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import {
  fetchSchoolAuditLogs,
  fetchSchoolSettings,
  updateSchoolSettingsRequest,
} from './schoolAdminApi';

type AuditCategory = 'ALL' | 'AUTH' | 'SCHOOL' | 'ACADEMIC' | 'USER' | 'SETTINGS';

function getActionBadge(action: string) {
  if (action.includes('AUTH_') || action.includes('PASSWORD') || action.includes('SESSION')) {
    return <Badge variant="danger">Security</Badge>;
  }
  if (action.includes('SETTINGS') || action.includes('UPDATED')) {
    return <Badge variant="brand">Settings</Badge>;
  }
  if (
    action.includes('ACADEMIC') ||
    action.includes('CLASS') ||
    action.includes('SECTION') ||
    action.includes('SUBJECT')
  ) {
    return <Badge variant="info">Academic</Badge>;
  }
  if (action.includes('INVITATION') || action.includes('STUDENT') || action.includes('TEACHER')) {
    return <Badge variant="success">User</Badge>;
  }
  return <Badge variant="neutral">System</Badge>;
}

export function SchoolSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'audit'>('profile');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditCategory, setAuditCategory] = useState<AuditCategory>('ALL');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDto | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['school-admin', 'settings'],
    queryFn: ({ signal }) => fetchSchoolSettings(signal),
  });

  const auditQuery = useQuery({
    queryKey: ['school-admin', 'audit-logs', auditActionFilter, auditCategory],
    queryFn: ({ signal }) =>
      fetchSchoolAuditLogs(
        {
          action: auditActionFilter.trim() || undefined,
          category: auditCategory,
        },
        signal,
      ),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateSchoolSettingsInput>({
    resolver: createZodResolver(updateSchoolSettingsSchema),
    defaultValues: {
      name: '',
      contactEmail: '',
      preferences: {
        emailNotificationsEnabled: true,
        weeklyAttendanceDigest: true,
        studentSupportAlerts: true,
      },
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        name: settingsQuery.data.name,
        contactEmail: settingsQuery.data.contactEmail,
        preferences: settingsQuery.data.preferences ?? {
          emailNotificationsEnabled: true,
          weeklyAttendanceDigest: true,
          studentSupportAlerts: true,
        },
      });
    }
  }, [settingsQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: updateSchoolSettingsRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'School settings updated',
        description: 'Institutional profile and operational preferences saved.',
        variant: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to save settings.',
        variant: 'danger',
      });
    },
  });

  const auditColumns: DataTableColumn<AuditLogDto>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (r) => (
        <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          {new Date(r.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => getActionBadge(r.action),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => <span className="font-mono text-xs font-medium">{r.action}</span>,
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (r) => (
        <span className="text-xs">
          {r.entityType} ({r.entityId.slice(0, 8)}...)
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (r) => <span className="text-xs">{r.actorEmail ?? 'System'}</span>,
    },
    {
      key: 'inspect',
      header: 'Payload',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedAuditLog(r)}
          aria-label={`View payload for ${r.action}`}
          leftIcon={<Eye className="h-3.5 w-3.5" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <AppShell
      title="Settings & Audit Log"
      breadcrumbs={[
        { label: 'School Administrator', to: '/admin' },
        { label: 'Settings & Audit Log' },
      ]}
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--color-border-default)]">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            School Profile &amp; Preferences
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'audit'
                ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Institutional Audit Log
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* School Profile Card */}
            <Card padding="lg">
              <Heading level={2} size="h3">
                Institutional Profile &amp; Contact Information
              </Heading>
              <Text variant="small" className="mt-1">
                Official institutional name, verified contact address, and tenant identifiers.
              </Text>

              {settingsQuery.isLoading && <Skeleton className="mt-4 h-32 w-full" />}
              {settingsQuery.isError && (
                <ErrorState
                  description="Unable to load school settings."
                  onRetry={() => void settingsQuery.refetch()}
                  className="mt-4"
                />
              )}

              {settingsQuery.data && (
                <form
                  onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
                  className="mt-5 space-y-5"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="School Name" error={errors.name?.message} required>
                      {(props) => (
                        <Input {...props} {...register('name')} hasError={Boolean(errors.name)} />
                      )}
                    </FormField>
                    <FormField label="Contact Email" error={errors.contactEmail?.message} required>
                      {(props) => (
                        <Input
                          {...props}
                          {...register('contactEmail')}
                          type="email"
                          hasError={Boolean(errors.contactEmail)}
                        />
                      )}
                    </FormField>
                  </div>

                  {/* Read-Only Institutional Metadata */}
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-4 text-xs">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <span className="font-medium text-[var(--color-text-secondary)]">
                          Institutional Code:
                        </span>
                        <p className="mt-0.5 font-mono font-semibold text-[var(--color-text-primary)]">
                          {settingsQuery.data.code}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--color-text-secondary)]">
                          Tenant Subdomain:
                        </span>
                        <p className="mt-0.5 font-mono font-semibold text-[var(--color-text-primary)]">
                          {settingsQuery.data.subdomain}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--color-text-secondary)]">
                          Tenant Operational Status:
                        </span>
                        <div className="mt-0.5">
                          <Badge
                            variant={settingsQuery.data.status === 'ACTIVE' ? 'success' : 'warning'}
                          >
                            {settingsQuery.data.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Calendar Association */}
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                          Current Active Academic Term:
                        </span>
                        <p className="text-sm font-medium text-[var(--color-brand-primary)]">
                          {settingsQuery.data.activeAcademicYearName ??
                            'No Active Academic Year Set'}
                        </p>
                      </div>
                      <Link to="/admin/academic">
                        <Button variant="outline" size="sm">
                          Configure Academic Calendar
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Operational Preferences Section */}
                  <div className="border-t border-[var(--color-border-default)] pt-4">
                    <Heading level={3} size="h4">
                      Operational Notification Preferences
                    </Heading>
                    <Text variant="caption" className="mt-0.5">
                      Configure automated digests and alert delivery for faculty and guardians.
                    </Text>

                    <div className="mt-3 space-y-3">
                      <label className="flex items-center gap-3 text-xs text-[var(--color-text-primary)] cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('preferences.emailNotificationsEnabled')}
                          className="h-4 w-4 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                        <span>
                          Enable automated email notifications for faculty and guardian account
                          activations
                        </span>
                      </label>

                      <label className="flex items-center gap-3 text-xs text-[var(--color-text-primary)] cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('preferences.weeklyAttendanceDigest')}
                          className="h-4 w-4 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                        <span>
                          Generate and deliver weekly student attendance summaries to administration
                        </span>
                      </label>

                      <label className="flex items-center gap-3 text-xs text-[var(--color-text-primary)] cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('preferences.studentSupportAlerts')}
                          className="h-4 w-4 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                        <span>
                          Surface high-priority student support flags proposed by teachers directly
                          on dashboard
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" loading={updateMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Heading level={2} size="h3">
                  Institutional Audit Log
                </Heading>
                <Text variant="small" className="mt-0.5">
                  Immutable security and operational event trail strictly scoped to this school
                  tenant.
                </Text>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void auditQuery.refetch()}
                disabled={auditQuery.isFetching}
                leftIcon={
                  <RefreshCw className={`h-4 w-4 ${auditQuery.isFetching ? 'animate-spin' : ''}`} />
                }
              >
                Refresh Log
              </Button>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: 'ALL', label: 'All Events' },
                  { key: 'AUTH', label: 'Authentication' },
                  { key: 'ACADEMIC', label: 'Academic & Classes' },
                  { key: 'USER', label: 'Staff & Students' },
                  { key: 'SETTINGS', label: 'Settings & Policy' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setAuditCategory(cat.key)}
                  className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors ${
                    auditCategory === cat.key
                      ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              <Input
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                placeholder="Filter by action name..."
                className="max-w-xs ml-auto"
              />
            </div>

            {auditQuery.isError ? (
              <ErrorState
                description="Unable to load audit log."
                onRetry={() => void auditQuery.refetch()}
              />
            ) : (
              <DataTable
                ariaLabel="Institutional audit log"
                loading={auditQuery.isLoading}
                rows={auditQuery.data ?? []}
                getRowKey={(r) => r.id}
                emptyTitle="No audit events recorded"
                emptyDescription="Security and data mutation events for your school appear here."
                columns={auditColumns}
              />
            )}
          </div>
        )}

        {/* Audit Payload Viewer Dialog */}
        {selectedAuditLog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="school-log-inspector-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-brand-primary)]" />
                  <Heading level={3} size="h3" id="school-log-inspector-title">
                    Audit Event Payload
                  </Heading>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedAuditLog(null)}>
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
                      {selectedAuditLog.action}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">
                      Entity:
                    </span>
                    <p className="font-mono text-[var(--color-text-primary)]">
                      {selectedAuditLog.entityType} ({selectedAuditLog.entityId.slice(0, 8)}...)
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">Actor:</span>
                    <p className="text-[var(--color-text-primary)]">
                      {selectedAuditLog.actorEmail ?? 'System'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--color-text-secondary)]">
                      Timestamp:
                    </span>
                    <p className="text-[var(--color-text-primary)]">
                      {new Date(selectedAuditLog.createdAt).toISOString()}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-[var(--color-text-secondary)]">
                    Audit Delta Payload (Sanitized):
                  </span>
                  <pre className="mt-1 max-h-48 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3 font-mono text-[11px] text-[var(--color-text-primary)]">
                    {selectedAuditLog.delta
                      ? JSON.stringify(selectedAuditLog.delta, null, 2)
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

export default SchoolSettingsPage;
