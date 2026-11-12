import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStaffSchema, type CreateStaffInput } from '@fsd-sdg4/validation';
import type { StaffMemberDto } from '@fsd-sdg4/contracts';
import { UserPlus } from 'lucide-react';
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
  PasswordInput,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import { createStaffRequest, fetchStaff, updateStaffStatusRequest } from './schoolAdminApi';

export function StaffDirectoryPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<StaffMemberDto | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['school-admin', 'staff'],
    queryFn: ({ signal }) => fetchStaff(signal),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStaffInput>({
    resolver: createZodResolver(createStaffSchema),
    defaultValues: {
      email: '',
      employeeId: '',
      firstName: '',
      lastName: '',
      specialization: '',
      temporaryPassword: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createStaffRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Teacher account provisioned',
        description: `${created.firstName} ${created.lastName} (${created.employeeId}) added.`,
        variant: 'success',
      });
      setModalOpen(false);
      setFormError(null);
      reset();
    },
    onError: (err) => {
      setFormError(err instanceof ApiClientError ? err.detail : 'Unable to provision teacher.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      updateStaffStatusRequest(id, status),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Staff status updated',
        description: `${updated.firstName} ${updated.lastName} is now ${updated.status}.`,
        variant: 'info',
      });
      setStatusTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Status update failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to update status.',
        variant: 'danger',
      });
      setStatusTarget(null);
    },
  });

  return (
    <AppShell
      title="Staff & Teachers"
      breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Staff & Teachers' }]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Staff Directory &amp; Roles
            </Heading>
            <Text variant="small" className="mt-1">
              Provision teacher accounts and manage active institutional access.
            </Text>
          </div>
          <Button
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
          >
            Provision Teacher
          </Button>
        </div>

        {isError ? (
          <ErrorState
            title="Unable to load staff directory"
            description={error instanceof Error ? error.message : 'Unable to fetch staff.'}
            onRetry={() => void refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="Staff directory"
            loading={isLoading}
            rows={data ?? []}
            getRowKey={(r) => r.id}
            emptyTitle="No staff members registered"
            emptyDescription="Provision your first teacher account to assign courses."
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (r) => (
                  <div>
                    <p className="font-semibold">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.email}</p>
                  </div>
                ),
              },
              { key: 'employeeId', header: 'Employee ID', render: (r) => r.employeeId },
              {
                key: 'specialization',
                header: 'Specialization',
                render: (r) => r.specialization ?? '—',
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge variant={r.status === 'ACTIVE' ? 'success' : 'warning'}>{r.status}</Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (r) => (
                  <Button
                    size="sm"
                    variant={r.status === 'ACTIVE' ? 'danger' : 'outline'}
                    onClick={() => setStatusTarget(r)}
                  >
                    {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision Teacher Account"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="staff-form" loading={createMutation.isPending}>
              Provision Teacher
            </Button>
          </>
        }
      >
        {formError && (
          <Alert variant="danger" className="mb-3">
            {formError}
          </Alert>
        )}
        <form
          id="staff-form"
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="First name" error={errors.firstName?.message} required>
              {(props) => (
                <Input {...props} {...register('firstName')} hasError={Boolean(errors.firstName)} />
              )}
            </FormField>
            <FormField label="Last name" error={errors.lastName?.message} required>
              {(props) => (
                <Input {...props} {...register('lastName')} hasError={Boolean(errors.lastName)} />
              )}
            </FormField>
          </div>
          <FormField label="Institutional email" error={errors.email?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('email')}
                type="email"
                hasError={Boolean(errors.email)}
              />
            )}
          </FormField>
          <FormField label="Employee ID" error={errors.employeeId?.message} required>
            {(props) => (
              <Input {...props} {...register('employeeId')} hasError={Boolean(errors.employeeId)} />
            )}
          </FormField>
          <FormField label="Specialization" error={errors.specialization?.message}>
            {(props) => <Input {...props} {...register('specialization')} />}
          </FormField>
          <FormField
            label="Temporary password"
            hint="Min 12 chars with uppercase, lowercase, digit, and symbol."
            error={errors.temporaryPassword?.message}
            required
          >
            {(props) => (
              <PasswordInput
                {...props}
                {...register('temporaryPassword')}
                hasError={Boolean(errors.temporaryPassword)}
              />
            )}
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          if (statusTarget) {
            statusMutation.mutate({
              id: statusTarget.id,
              status: statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            });
          }
        }}
        title={
          statusTarget?.status === 'ACTIVE'
            ? 'Deactivate staff account?'
            : 'Activate staff account?'
        }
        description={`Confirm access change for ${statusTarget?.firstName ?? ''} ${statusTarget?.lastName ?? ''}.`}
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={statusTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
      />
    </AppShell>
  );
}

export default StaffDirectoryPage;
