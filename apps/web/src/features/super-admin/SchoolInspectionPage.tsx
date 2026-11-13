import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { updateSchoolSchema, type UpdateSchoolInput } from '@fsd-sdg4/validation';
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  GraduationCap,
  Layers,
  Mail,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import { fetchSchoolDetail, updateSchoolRequest } from './superAdminApi';

export function SchoolInspectionPage() {
  const { schoolId = '' } = useParams<{ schoolId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch complete school details
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['super-admin', 'school', schoolId],
    queryFn: ({ signal }) => fetchSchoolDetail(schoolId, signal),
    enabled: schoolId.length > 0,
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateSchoolInput>({
    resolver: createZodResolver(updateSchoolSchema),
    defaultValues: { name: '', contactEmail: '' },
  });

  // Open edit modal
  const handleOpenEdit = () => {
    if (!data) return;
    setEditError(null);
    resetEdit({
      name: data.name,
      contactEmail: data.contactEmail,
    });
    setEditOpen(true);
  };

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: (input: UpdateSchoolInput) => updateSchoolRequest(schoolId, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: 'Tenant updated successfully',
        description: `School "${updated.name}" has been updated.`,
        variant: 'success',
      });
      setEditOpen(false);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(err instanceof ApiClientError ? err.detail : 'Unable to update school details.');
    },
  });

  // Status toggle mutation (Suspend / Activate)
  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED') => updateSchoolRequest(schoolId, { status }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: updated.status === 'ACTIVE' ? 'Tenant activated' : 'Tenant suspended',
        description: `School "${updated.name}" is now ${updated.status}.`,
        variant: updated.status === 'ACTIVE' ? 'success' : 'warning',
      });
      setConfirmOpen(false);
    },
    onError: (err) => {
      showToast({
        title: 'Status change failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to update tenant status.',
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
      <div className="space-y-6">
        {/* Navigation back-link and action controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/super-admin/schools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Schools Directory
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              }
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh tenant data"
            >
              Refresh
            </Button>
            {data && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={handleOpenEdit}
                >
                  Edit School
                </Button>
                <Button
                  variant={data.status === 'ACTIVE' ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                >
                  {data.status === 'ACTIVE' ? 'Suspend Tenant Access' : 'Activate Tenant'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Loading and Error states */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {isError && (
          <ErrorState
            title="Unable to load tenant details"
            description={error instanceof Error ? error.message : 'Tenant lookup request failed.'}
            onRetry={() => void refetch()}
          />
        )}

        {/* Loaded School Details */}
        {data && (
          <div className="space-y-6">
            {/* Primary Institution Header Card */}
            <Card padding="lg" className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Heading level={2} size="h2">
                      {data.name}
                    </Heading>
                    <Badge
                      variant={
                        data.status === 'ACTIVE'
                          ? 'success'
                          : data.status === 'SUSPENDED'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {data.status}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-1 font-mono">
                      <span className="font-semibold text-[var(--color-text-primary)]">Code:</span>{' '}
                      {data.code}
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        Subdomain:
                      </span>{' '}
                      <a
                        href={`https://${data.subdomain}.fsd-sdg4.edu`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-0.5"
                      >
                        {data.subdomain}.fsd-sdg4.edu <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <a
                        href={`mailto:${data.contactEmail}`}
                        className="text-[var(--color-brand-primary)] hover:underline"
                      >
                        {data.contactEmail}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Tenant Isolation Active · Zero Trust Scoped</span>
                </div>
              </div>

              {/* Status Banner Notice if Suspended */}
              {data.status === 'SUSPENDED' && (
                <Alert
                  variant="warning"
                  title="Tenant Under Administrative Suspension"
                  className="mt-2"
                >
                  All user accounts under &ldquo;{data.name}&rdquo; are currently blocked from
                  signing in to the platform. To restore access, click &ldquo;Activate Tenant&rdquo;
                  above.
                </Alert>
              )}
            </Card>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Total Users</Text>
                  <Users className="h-4 w-4 text-[var(--color-brand-primary)]" />
                </div>
                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                  {data.userCount}
                </p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Platform accounts
                </Text>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Students Enrolled</Text>
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                </div>
                <p className="mt-1 text-2xl font-bold text-blue-600">{data.studentCount}</p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Active profiles
                </Text>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Staff &amp; Teachers</Text>
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-1 text-2xl font-bold text-indigo-600">{data.staffCount}</p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Faculty profiles
                </Text>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Classes &amp; Sections</Text>
                  <Layers className="h-4 w-4 text-purple-600" />
                </div>
                <p className="mt-1 text-2xl font-bold text-purple-600">
                  {data.classCount}{' '}
                  <span className="text-sm font-normal text-[var(--color-text-muted)]">
                    / {data.sectionCount ?? 0}
                  </span>
                </p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Classes / Sections
                </Text>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Academic Year</Text>
                  <Calendar className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-base font-bold text-[var(--color-text-primary)] truncate">
                  {data.activeAcademicYear ?? 'Not set'}
                </p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Current active term
                </Text>
              </Card>
            </div>

            {/* Multi-Tenant Governance & Operational Data */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Institution Identity Card */}
              <Card padding="lg" className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
                  <Building2 className="h-5 w-5 text-[var(--color-brand-primary)]" />
                  <Heading level={3} size="h3">
                    Institutional Governance
                  </Heading>
                </div>

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                    <dt className="text-[var(--color-text-muted)]">Tenant Database ID (UUID)</dt>
                    <dd className="font-mono font-semibold text-[var(--color-text-primary)] mt-1 truncate">
                      {data.id}
                    </dd>
                  </div>

                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                    <dt className="text-[var(--color-text-muted)]">Provisioning Timestamp</dt>
                    <dd className="font-semibold text-[var(--color-text-primary)] mt-1">
                      {new Date(data.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </dd>
                  </div>

                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                    <dt className="text-[var(--color-text-muted)]">Subdomain Routing</dt>
                    <dd className="font-mono text-[var(--color-text-primary)] mt-1">
                      {data.subdomain}.fsd-sdg4.edu
                    </dd>
                  </div>

                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                    <dt className="text-[var(--color-text-muted)]">Operational State</dt>
                    <dd className="mt-1">
                      <Badge
                        variant={
                          data.status === 'ACTIVE'
                            ? 'success'
                            : data.status === 'SUSPENDED'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {data.status}
                      </Badge>
                    </dd>
                  </div>
                </dl>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3.5 text-xs text-[var(--color-text-secondary)] space-y-1">
                  <p className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-[var(--color-brand-primary)]" /> Cryptographic
                    Boundary Policy
                  </p>
                  <p>
                    All API queries, student records, assignments, and sessions for this institution
                    are strictly verified against <code>school_id: &ldquo;{data.id}&rdquo;</code> at
                    the database layer per ADR-0004 and ADR-0007.
                  </p>
                </div>
              </Card>

              {/* Administrative Activity & Audit Trail */}
              <Card padding="lg" className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[var(--color-brand-primary)]" />
                    <Heading level={3} size="h3">
                      Administrative Audit Trail
                    </Heading>
                  </div>
                  <Badge variant="neutral">Verified</Badge>
                </div>

                {data.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {data.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                            {log.action}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                          <span>
                            Actor: <strong>{log.actorEmail ?? 'Platform System'}</strong>
                          </span>
                          <span>Entity: {log.entityType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[var(--color-text-muted)] border border-dashed rounded-[var(--radius-md)]">
                    No recent administrative actions recorded for this tenant yet.
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Edit School Profile */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${data?.name ?? 'School Tenant'}`}
        description="Update institutional contact details and operational naming. Identifier code and subdomain are immutable."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-school-details-form"
              loading={editMutation.isPending}
              disabled={editMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editError && (
          <Alert
            variant="danger"
            title="Update failed"
            className="mb-4"
            onDismiss={() => setEditError(null)}
          >
            {editError}
          </Alert>
        )}
        {data && (
          <form
            id="edit-school-details-form"
            onSubmit={handleSubmitEdit((values) => editMutation.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <FormField label="School name" error={editErrors.name?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...registerEdit('name')}
                  placeholder="School name"
                  hasError={Boolean(editErrors.name)}
                />
              )}
            </FormField>

            <FormField label="Contact email" error={editErrors.contactEmail?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...registerEdit('contactEmail')}
                  type="email"
                  placeholder="contact@school.edu"
                  hasError={Boolean(editErrors.contactEmail)}
                />
              )}
            </FormField>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1">
              <p className="font-semibold text-[var(--color-text-primary)]">
                Immutable Tenant Identifiers:
              </p>
              <p>
                <strong>School Code:</strong> <span className="font-mono">{data.code}</span>
              </p>
              <p>
                <strong>Subdomain:</strong>{' '}
                <span className="font-mono">{data.subdomain}.fsd-sdg4.edu</span>
              </p>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Dialog: Suspend / Activate School */}
      {data && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => statusMutation.mutate(data.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
          title={
            data.status === 'ACTIVE' ? `Suspend ${data.name}?` : `Restore access for ${data.name}?`
          }
          description={
            data.status === 'ACTIVE'
              ? `Suspending "${data.name}" immediately blocks all teachers, students, parents, and school administrators belonging to this institution from signing in. All academic records, assignments, and audit logs are safely preserved.`
              : `Reactivating "${data.name}" restores platform sign-in and academic access for all active institutional users.`
          }
          confirmLabel={data.status === 'ACTIVE' ? 'Suspend Tenant Access' : 'Activate Tenant'}
          variant={data.status === 'ACTIVE' ? 'danger' : 'primary'}
          loading={statusMutation.isPending}
        />
      )}
    </AppShell>
  );
}

export default SchoolInspectionPage;
