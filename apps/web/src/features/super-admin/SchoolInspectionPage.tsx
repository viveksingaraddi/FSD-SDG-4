import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Heading,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { fetchSchoolDetail, updateSchoolRequest } from './superAdminApi';

export function SchoolInspectionPage() {
  const { schoolId = '' } = useParams<{ schoolId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['super-admin', 'school', schoolId],
    queryFn: ({ signal }) => fetchSchoolDetail(schoolId, signal),
    enabled: schoolId.length > 0,
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED') => updateSchoolRequest(schoolId, { status }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: 'Tenant configuration updated',
        description: `${updated.name} status is now ${updated.status}.`,
        variant: 'success',
      });
      setConfirmOpen(false);
    },
    onError: (err) => {
      showToast({
        title: 'Update failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to update tenant.',
        variant: 'danger',
      });
      setConfirmOpen(false);
    },
  });

  return (
    <AppShell
      title="Tenant Inspection"
      breadcrumbs={[
        { label: 'Platform Super Admin', to: '/super-admin' },
        { label: 'Schools', to: '/super-admin/schools' },
        { label: data?.name ?? 'Details' },
      ]}
    >
      <div className="space-y-5">
        <Link
          to="/super-admin/schools"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-primary)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Schools Directory
        </Link>

        {isLoading && <Skeleton className="h-48 w-full" />}

        {isError && (
          <ErrorState
            title="Unable to load tenant details"
            description={error instanceof Error ? error.message : 'Tenant lookup failed.'}
            onRetry={() => void refetch()}
          />
        )}

        {data && (
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Heading level={2} size="h2">
                    {data.name}
                  </Heading>
                  <Badge variant={data.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {data.status}
                  </Badge>
                </div>
                <Text variant="small" className="mt-1">
                  Code: {data.code} · Subdomain: {data.subdomain} · Contact: {data.contactEmail}
                </Text>
              </div>

              <Button
                variant={data.status === 'ACTIVE' ? 'danger' : 'primary'}
                onClick={() => setConfirmOpen(true)}
              >
                {data.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-[var(--color-border-default)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Text variant="caption">Active Academic Year</Text>
                <p className="mt-1 font-semibold">{data.activeAcademicYear ?? 'Not configured'}</p>
              </div>
              <div>
                <Text variant="caption">Total Users</Text>
                <p className="mt-1 font-semibold">{data.userCount}</p>
              </div>
              <div>
                <Text variant="caption">Enrolled Students</Text>
                <p className="mt-1 font-semibold">{data.studentCount}</p>
              </div>
              <div>
                <Text variant="caption">Classes / Staff</Text>
                <p className="mt-1 font-semibold">
                  {data.classCount} classes · {data.staffCount} staff
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {data && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => statusMutation.mutate(data.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
          title={data.status === 'ACTIVE' ? 'Suspend tenant access?' : 'Restore tenant access?'}
          description={`Confirm status change for "${data.name}".`}
          confirmLabel={data.status === 'ACTIVE' ? 'Suspend Tenant' : 'Restore Tenant'}
          variant={data.status === 'ACTIVE' ? 'danger' : 'primary'}
          loading={statusMutation.isPending}
        />
      )}
    </AppShell>
  );
}

export default SchoolInspectionPage;
