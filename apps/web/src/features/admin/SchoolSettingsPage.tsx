import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateSchoolSettingsSchema, type UpdateSchoolSettingsInput } from '@fsd-sdg4/validation';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  DataTable,
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

export function SchoolSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ['school-admin', 'settings'],
    queryFn: ({ signal }) => fetchSchoolSettings(signal),
  });

  const auditQuery = useQuery({
    queryKey: ['school-admin', 'audit-logs'],
    queryFn: ({ signal }) => fetchSchoolAuditLogs(signal),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateSchoolSettingsInput>({
    resolver: createZodResolver(updateSchoolSettingsSchema),
    defaultValues: { name: '', contactEmail: '' },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        name: settingsQuery.data.name,
        contactEmail: settingsQuery.data.contactEmail,
      });
    }
  }, [settingsQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: updateSchoolSettingsRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'School settings updated',
        description: 'Institutional profile changes saved.',
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

  return (
    <AppShell
      title="Settings & Audit Log"
      breadcrumbs={[
        { label: 'School Administrator', to: '/admin' },
        { label: 'Settings & Audit Log' },
      ]}
    >
      <div className="space-y-6">
        <Card padding="lg">
          <Heading level={2} size="h2">
            School Profile &amp; Contact Settings
          </Heading>
          <Text variant="small" className="mt-1">
            Manage official institutional name and administrative contact email.
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
              className="mt-4 max-w-lg space-y-4"
            >
              <FormField label="School name" error={errors.name?.message} required>
                {(props) => (
                  <Input {...props} {...register('name')} hasError={Boolean(errors.name)} />
                )}
              </FormField>
              <FormField label="Contact email" error={errors.contactEmail?.message} required>
                {(props) => (
                  <Input
                    {...props}
                    {...register('contactEmail')}
                    type="email"
                    hasError={Boolean(errors.contactEmail)}
                  />
                )}
              </FormField>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Settings
              </Button>
            </form>
          )}
        </Card>

        <div className="space-y-3">
          <Heading level={2} size="h3">
            Institutional Audit Log
          </Heading>
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
              columns={[
                { key: 'action', header: 'Action', render: (r) => <Badge>{r.action}</Badge> },
                { key: 'entity', header: 'Entity', render: (r) => r.entityType },
                { key: 'actor', header: 'Actor', render: (r) => r.actorEmail ?? 'System' },
                {
                  key: 'time',
                  header: 'Timestamp',
                  render: (r) => (
                    <time dateTime={r.createdAt} className="text-xs text-[var(--color-text-muted)]">
                      {new Date(r.createdAt).toLocaleString()}
                    </time>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default SchoolSettingsPage;
