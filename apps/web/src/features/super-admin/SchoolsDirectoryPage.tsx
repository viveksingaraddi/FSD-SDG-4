import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createSchoolSchema, type CreateSchoolInput } from '@fsd-sdg4/validation';
import type { SchoolSummaryDto } from '@fsd-sdg4/contracts';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  SearchInput,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import { createSchoolRequest, fetchSchools, updateSchoolRequest } from './superAdminApi';

export function SchoolsDirectoryPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SchoolSummaryDto | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['super-admin', 'schools', search],
    queryFn: ({ signal }) => fetchSchools(search, signal),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSchoolInput>({
    resolver: createZodResolver(createSchoolSchema),
    defaultValues: { name: '', code: '', subdomain: '', contactEmail: '' },
  });

  const createMutation = useMutation({
    mutationFn: createSchoolRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: 'Tenant provisioned',
        description: `School "${created.name}" is now active.`,
        variant: 'success',
      });
      setCreateOpen(false);
      setFormError(null);
      reset();
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiClientError ? err.detail : 'Unable to provision school tenant.',
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      updateSchoolRequest(id, { status }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: 'Tenant status updated',
        description: `${updated.name} is now ${updated.status}.`,
        variant: 'info',
      });
      setToggleTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Status update failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to update tenant.',
        variant: 'danger',
      });
      setToggleTarget(null);
    },
  });

  return (
    <AppShell
      title="Schools Directory"
      breadcrumbs={[{ label: 'Platform Super Admin', to: '/super-admin' }, { label: 'Schools' }]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Tenant Directory &amp; Setup
            </Heading>
            <Text variant="small" className="mt-1">
              Provision isolated school tenants and manage active status.
            </Text>
          </div>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
          >
            Provision School
          </Button>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search schools"
          placeholder="Search by school name, code, or subdomain..."
          className="max-w-md"
        />

        {isError ? (
          <ErrorState
            title="Unable to load schools"
            description={error instanceof Error ? error.message : 'Failed to fetch schools.'}
            onRetry={() => void refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="School tenants"
            loading={isLoading}
            rows={data ?? []}
            getRowKey={(row) => row.id}
            emptyTitle="No school tenants found"
            emptyDescription="No school tenants match your current search query."
            columns={[
              {
                key: 'name',
                header: 'School',
                render: (row) => (
                  <div>
                    <Link
                      to={`/super-admin/schools/${row.id}`}
                      className="font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {row.subdomain}.fsd-sdg4.edu · {row.code}
                    </p>
                  </div>
                ),
              },
              {
                key: 'users',
                header: 'Users / Students',
                render: (row) => (
                  <span className="text-sm">
                    {row.userCount} users · {row.studentCount} students
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge variant={row.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (row) => (
                  <div className="flex justify-end gap-2">
                    <Link to={`/super-admin/schools/${row.id}`}>
                      <Button size="sm" variant="outline">
                        Inspect
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={row.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      onClick={() => setToggleTarget(row)}
                    >
                      {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Provision New School Tenant"
        description="Creates an isolated school tenant with its own subdomain and code."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-school-form" loading={createMutation.isPending}>
              Provision School
            </Button>
          </>
        }
      >
        {formError && (
          <Alert variant="danger" title="Provisioning failed" className="mb-4">
            {formError}
          </Alert>
        )}
        <form
          id="create-school-form"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-4"
        >
          <FormField label="School name" error={errors.name?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('name')}
                placeholder="e.g. Horizon Public Academy"
                hasError={Boolean(errors.name)}
              />
            )}
          </FormField>
          <FormField label="School code" error={errors.code?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('code')}
                placeholder="e.g. HPA-01"
                hasError={Boolean(errors.code)}
              />
            )}
          </FormField>
          <FormField label="Subdomain" error={errors.subdomain?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('subdomain')}
                placeholder="e.g. horizon-academy"
                hasError={Boolean(errors.subdomain)}
              />
            )}
          </FormField>
          <FormField label="Contact email" error={errors.contactEmail?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('contactEmail')}
                type="email"
                placeholder="admin@school.edu"
                hasError={Boolean(errors.contactEmail)}
              />
            )}
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={toggleTarget !== null}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          if (toggleTarget) {
            statusMutation.mutate({
              id: toggleTarget.id,
              status: toggleTarget.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
            });
          }
        }}
        title={
          toggleTarget?.status === 'ACTIVE' ? 'Suspend school tenant?' : 'Activate school tenant?'
        }
        description={
          toggleTarget?.status === 'ACTIVE'
            ? `Suspending "${toggleTarget.name}" blocks all tenant users from signing in until reactivated.`
            : `Reactivating "${toggleTarget?.name ?? ''}" restores access for tenant users.`
        }
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
      />
    </AppShell>
  );
}

export default SchoolsDirectoryPage;
