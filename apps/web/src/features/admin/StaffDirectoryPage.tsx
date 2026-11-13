import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from '@fsd-sdg4/validation';
import type { StaffMemberDto } from '@fsd-sdg4/contracts';
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  PasswordInput,
  SearchInput,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import {
  createStaffRequest,
  fetchStaff,
  updateStaffRequest,
  updateStaffStatusRequest,
} from './schoolAdminApi';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
type SortField = 'name' | 'employeeId' | 'specialization' | 'allocationCount' | 'status';
type SortDirection = 'asc' | 'desc';

export function StaffDirectoryPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Search, filter, sorting, and pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals & targets
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMemberDto | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<StaffMemberDto | null>(null);

  // Fetch teachers with search & status query
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['school-admin', 'staff', search, statusFilter],
    queryFn: ({ signal }) =>
      fetchStaff(
        {
          search: search.trim() ? search.trim() : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
        signal,
      ),
  });

  // Create form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateStaffInput>({
    resolver: createZodResolver(createStaffSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      specialization: '',
      temporaryPassword: '',
    },
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateStaffInput>({
    resolver: createZodResolver(updateStaffSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      specialization: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createStaffRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Teacher account provisioned',
        description: `${created.firstName} ${created.lastName} (${created.employeeId}) added successfully.`,
        variant: 'success',
      });
      setCreateOpen(false);
      setCreateError(null);
      resetCreate();
    },
    onError: (err) => {
      setCreateError(
        err instanceof ApiClientError ? err.detail : 'Unable to provision teacher account.',
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffInput }) =>
      updateStaffRequest(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Teacher details updated',
        description: `Profile for ${updated.firstName} ${updated.lastName} has been saved.`,
        variant: 'success',
      });
      setEditTarget(null);
      setEditError(null);
      resetEdit();
    },
    onError: (err) => {
      setEditError(
        err instanceof ApiClientError ? err.detail : 'Unable to update teacher profile.',
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' }) =>
      updateStaffStatusRequest(id, status),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: updated.status === 'ACTIVE' ? 'Teacher activated' : 'Teacher access suspended',
        description: `${updated.firstName} ${updated.lastName} is now ${updated.status}.`,
        variant: updated.status === 'ACTIVE' ? 'success' : 'warning',
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

  // Client-side sort and page calculations
  const rawList = data ?? [];

  const totalTeachers = rawList.length;
  const activeTeachers = rawList.filter((s) => s.status === 'ACTIVE').length;
  const inactiveTeachers = rawList.filter((s) => s.status !== 'ACTIVE').length;
  const totalAllocations = rawList.reduce((acc, s) => acc + (s.allocationCount ?? 0), 0);

  const sortedList = useMemo(() => {
    return [...rawList].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      } else if (sortField === 'employeeId') {
        cmp = a.employeeId.localeCompare(b.employeeId);
      } else if (sortField === 'specialization') {
        cmp = (a.specialization ?? '').localeCompare(b.specialization ?? '');
      } else if (sortField === 'allocationCount') {
        cmp = (a.allocationCount ?? 0) - (b.allocationCount ?? 0);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [rawList, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTeachers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  }

  function openEditModal(staff: StaffMemberDto) {
    setEditTarget(staff);
    setEditError(null);
    resetEdit({
      firstName: staff.firstName,
      lastName: staff.lastName,
      specialization: staff.specialization ?? '',
    });
  }

  return (
    <AppShell
      title="Staff & Teachers"
      breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Staff & Teachers' }]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Staff &amp; Teacher Directory
            </Heading>
            <Text variant="small" className="mt-1 text-[var(--color-text-secondary)]">
              Provision teacher accounts, manage employment access, and inspect course allocations.
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh teacher list"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              Provision Teacher
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption" className="text-[var(--color-text-muted)]">
                Total Teachers
              </Text>
              <Users className="h-4 w-4 text-[var(--color-brand-primary)]" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {totalTeachers}
            </p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Faculty roster
            </Text>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption" className="text-[var(--color-text-muted)]">
                Active Faculty
              </Text>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{activeTeachers}</p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Portal access permitted
            </Text>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption" className="text-[var(--color-text-muted)]">
                Suspended / Inactive
              </Text>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{inactiveTeachers}</p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Sign-in blocked
            </Text>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption" className="text-[var(--color-text-muted)]">
                Course Allocations
              </Text>
              <BookOpen className="h-4 w-4 text-[var(--color-brand-primary)]" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {totalAllocations}
            </p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Class &amp; section links
            </Text>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-white p-4 shadow-xs">
          <div className="w-full max-w-sm">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              label="Search teachers"
              placeholder="Search by name, employee ID, or email..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Status:</span>
            {(['ALL', 'ACTIVE', 'INACTIVE', 'LOCKED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]'
                }`}
              >
                {st === 'ALL' ? 'All Faculty' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Table */}
        {isError ? (
          <ErrorState
            title="Unable to load teacher directory"
            description={error instanceof Error ? error.message : 'Failed to fetch teachers.'}
            onRetry={() => void refetch()}
          />
        ) : (
          <div className="space-y-4">
            <DataTable
              ariaLabel="Staff directory"
              loading={isLoading}
              rows={pagedTeachers}
              getRowKey={(r) => r.id}
              emptyTitle="No teachers found"
              emptyDescription="No teacher accounts match your current search and filter criteria."
              columns={[
                {
                  key: 'name',
                  header: (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                      onClick={() => handleSort('name')}
                    >
                      Teacher Name
                      <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    </button>
                  ),
                  render: (r) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)] text-xs font-bold text-[var(--color-brand-primary)]">
                        {r.firstName.charAt(0)}
                        {r.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/admin/staff/${r.id}`}
                          className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] hover:underline"
                        >
                          {r.firstName} {r.lastName}
                        </Link>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">{r.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'employeeId',
                  header: (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                      onClick={() => handleSort('employeeId')}
                    >
                      Employee ID
                      <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    </button>
                  ),
                  render: (r) => (
                    <span className="font-mono text-xs font-semibold text-[var(--color-text-secondary)]">
                      {r.employeeId}
                    </span>
                  ),
                },
                {
                  key: 'specialization',
                  header: (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                      onClick={() => handleSort('specialization')}
                    >
                      Specialization
                      <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    </button>
                  ),
                  render: (r) => (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {r.specialization ?? 'General Education'}
                    </span>
                  ),
                },
                {
                  key: 'allocationCount',
                  header: (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                      onClick={() => handleSort('allocationCount')}
                    >
                      Allocations
                      <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    </button>
                  ),
                  render: (r) => (
                    <Badge
                      variant={r.allocationCount && r.allocationCount > 0 ? 'brand' : 'neutral'}
                    >
                      {r.allocationCount ?? 0} course{r.allocationCount === 1 ? '' : 's'}
                    </Badge>
                  ),
                },
                {
                  key: 'status',
                  header: (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    </button>
                  ),
                  render: (r) => (
                    <Badge variant={r.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {r.status}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  render: (r) => (
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/staff/${r.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Inspect ${r.firstName} ${r.lastName}`}
                        >
                          Inspect
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                        onClick={() => openEditModal(r)}
                        aria-label={`Edit ${r.firstName} ${r.lastName}`}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={r.status === 'ACTIVE' ? 'danger' : 'secondary'}
                        onClick={() => setStatusTarget(r)}
                        aria-label={
                          r.status === 'ACTIVE'
                            ? `Deactivate ${r.firstName} ${r.lastName}`
                            : `Activate ${r.firstName} ${r.lastName}`
                        }
                      >
                        {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border-default)] px-2 pt-4">
                <Text variant="caption" className="text-[var(--color-text-muted)]">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, sortedList.length)} of {sortedList.length}{' '}
                  faculty
                </Text>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-semibold px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Provision Teacher */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Provision Teacher Account"
        description="Creates a new faculty account with institutional credentials for academic assignment."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-teacher-form"
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Provision Teacher
            </Button>
          </>
        }
      >
        {createError && (
          <Alert variant="danger" title="Provisioning failed" className="mb-4">
            {createError}
          </Alert>
        )}
        <form
          id="create-teacher-form"
          onSubmit={handleSubmitCreate((values) => createMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="First name" error={createErrors.firstName?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...registerCreate('firstName')}
                  placeholder="e.g. Eleanor"
                  hasError={Boolean(createErrors.firstName)}
                />
              )}
            </FormField>
            <FormField label="Last name" error={createErrors.lastName?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...registerCreate('lastName')}
                  placeholder="e.g. Vance"
                  hasError={Boolean(createErrors.lastName)}
                />
              )}
            </FormField>
          </div>

          <FormField label="Institutional email" error={createErrors.email?.message} required>
            {(props) => (
              <Input
                {...props}
                {...registerCreate('email')}
                type="email"
                placeholder="e.g. e.vance@school.edu"
                hasError={Boolean(createErrors.email)}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Employee ID" error={createErrors.employeeId?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...registerCreate('employeeId')}
                  placeholder="e.g. TCH-2026-042"
                  hasError={Boolean(createErrors.employeeId)}
                />
              )}
            </FormField>
            <FormField label="Specialization" error={createErrors.specialization?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...registerCreate('specialization')}
                  placeholder="e.g. Pure Mathematics, STEM"
                />
              )}
            </FormField>
          </div>

          <FormField
            label="Temporary password"
            hint="Min 12 characters with uppercase, lowercase, number, and special symbol."
            error={createErrors.temporaryPassword?.message}
            required
          >
            {(props) => (
              <PasswordInput
                {...props}
                {...registerCreate('temporaryPassword')}
                placeholder="••••••••••••"
                hasError={Boolean(createErrors.temporaryPassword)}
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* Modal: Edit Teacher Profile */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Edit Profile: ${editTarget?.firstName ?? ''} ${editTarget?.lastName ?? ''}`}
        description="Update personal details and academic subject specialization."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-teacher-form"
              loading={editMutation.isPending}
              disabled={editMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editError && (
          <Alert variant="danger" title="Update failed" className="mb-4">
            {editError}
          </Alert>
        )}
        {editTarget && (
          <form
            id="edit-teacher-form"
            onSubmit={handleSubmitEdit((values) =>
              editMutation.mutate({ id: editTarget.id, input: values }),
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First name" error={editErrors.firstName?.message} required>
                {(props) => (
                  <Input
                    {...props}
                    {...registerEdit('firstName')}
                    hasError={Boolean(editErrors.firstName)}
                  />
                )}
              </FormField>
              <FormField label="Last name" error={editErrors.lastName?.message} required>
                {(props) => (
                  <Input
                    {...props}
                    {...registerEdit('lastName')}
                    hasError={Boolean(editErrors.lastName)}
                  />
                )}
              </FormField>
            </div>

            <FormField label="Specialization" error={editErrors.specialization?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...registerEdit('specialization')}
                  placeholder="e.g. Physics, Natural Sciences"
                />
              )}
            </FormField>

            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3 text-xs">
              <p className="font-semibold text-[var(--color-text-secondary)]">
                Institutional Identity:
              </p>
              <p className="text-[var(--color-text-muted)] mt-1">
                Employee ID: <span className="font-mono font-bold">{editTarget.employeeId}</span> ·
                Email: {editTarget.email}
              </p>
              <p className="text-[var(--color-text-muted)] mt-1">
                Employee ID and institutional email are cryptographically bound to session
                authentication and cannot be changed here.
              </p>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Dialog: Activate / Deactivate */}
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
            ? `Deactivate ${statusTarget.firstName} ${statusTarget.lastName}?`
            : `Reactivate ${statusTarget?.firstName ?? ''} ${statusTarget?.lastName ?? ''}?`
        }
        description={
          statusTarget?.status === 'ACTIVE'
            ? `Deactivating "${statusTarget.firstName} ${statusTarget.lastName}" blocks platform access immediately. All historical attendance records, grading history, and assessment evaluations are permanently preserved in accordance with academic retention rules.`
            : `Reactivating "${statusTarget?.firstName ?? ''} ${statusTarget?.lastName ?? ''}" restores access to attendance marking, grade submission, and student support plan workflows.`
        }
        confirmLabel={
          statusTarget?.status === 'ACTIVE' ? 'Deactivate Access' : 'Reactivate Teacher'
        }
        variant={statusTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
      />
    </AppShell>
  );
}

export default StaffDirectoryPage;
