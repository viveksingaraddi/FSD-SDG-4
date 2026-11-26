import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  createSchoolSchema,
  updateSchoolSchema,
  type CreateSchoolInput,
  type UpdateSchoolInput,
} from '@fsd-sdg4/validation';
import type { SchoolSummaryDto } from '@fsd-sdg4/contracts';
import {
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Mail,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  X,
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
  SearchInput,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import { createSchoolRequest, fetchSchools, updateSchoolRequest } from './superAdminApi';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
type SortField = 'name' | 'code' | 'createdAt' | 'userCount' | 'studentCount';
type SortDirection = 'asc' | 'desc';

export function SchoolsDirectoryPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Search, filter, sorting and pagination state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SchoolSummaryDto | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SchoolSummaryDto | null>(null);

  // Fetch schools from API with backend search & status filter
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['super-admin', 'schools', search, statusFilter],
    queryFn: ({ signal }) => fetchSchools(search, statusFilter, signal),
  });

  // Provisioning form
  const [provisionResult, setProvisionResult] = useState<{
    schoolName: string;
    adminEmail?: string | undefined;
    invitationUrl?: string | undefined;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    setValue: setCreateValue,
    watch: watchCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateSchoolInput>({
    resolver: createZodResolver(createSchoolSchema),
    defaultValues: {
      name: '',
      code: '',
      subdomain: '',
      contactEmail: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
    },
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

  // Create school mutation
  const createMutation = useMutation({
    mutationFn: createSchoolRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: 'Tenant provisioned successfully',
        description: `School "${created.name}" is active with subdomain "${created.subdomain}".`,
        variant: 'success',
      });
      setCreateOpen(false);
      setFormError(null);
      resetCreate();

      if (created.invitationUrl) {
        setProvisionResult({
          schoolName: created.name,
          adminEmail: created.adminEmail,
          invitationUrl: created.invitationUrl,
        });
      }
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiClientError ? err.detail : 'Unable to provision school tenant.',
      );
    },
  });

  // Update school mutation (name / contactEmail / status)
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSchoolInput }) =>
      updateSchoolRequest(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: 'Tenant updated',
        description: `School "${updated.name}" has been updated.`,
        variant: 'success',
      });
      setEditTarget(null);
      setEditError(null);
      resetEdit();
    },
    onError: (err) => {
      setEditError(
        err instanceof ApiClientError ? err.detail : 'Unable to update school information.',
      );
    },
  });

  // Status toggle mutation (Suspend / Activate)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      updateSchoolRequest(id, { status }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      showToast({
        title: updated.status === 'ACTIVE' ? 'Tenant activated' : 'Tenant suspended',
        description: `School "${updated.name}" is now ${updated.status}.`,
        variant: updated.status === 'ACTIVE' ? 'success' : 'warning',
      });
      setToggleTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Status change failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to update tenant status.',
        variant: 'danger',
      });
      setToggleTarget(null);
    },
  });

  // Helpers for auto-generating slug and code in provisioning modal
  const enteredName = watchCreate('name');
  const handleAutoFillIdentifiers = () => {
    if (!enteredName || enteredName.trim().length === 0) return;
    const clean = enteredName.trim();
    // Subdomain: lowercase alphanumeric + hyphen
    const slug = clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
    // Code: uppercase abbreviation
    const code =
      'SCH-' +
      clean
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 12);

    setCreateValue('subdomain', slug, { shouldValidate: true });
    setCreateValue('code', code, { shouldValidate: true });
  };

  // Open Edit Modal for a given school
  const openEditModal = (school: SchoolSummaryDto) => {
    setEditTarget(school);
    setEditError(null);
    resetEdit({
      name: school.name,
      contactEmail: school.contactEmail,
    });
  };

  // Sort and paginate data
  const rawSchools = data ?? [];

  const sortedSchools = useMemo(() => {
    return [...rawSchools].sort((a, b) => {
      let comparison: number;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'userCount':
          comparison = a.userCount - b.userCount;
          break;
        case 'studentCount':
          comparison = a.studentCount - b.studentCount;
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rawSchools, sortField, sortDirection]);

  // Pagination calculation
  const totalItems = sortedSchools.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSchools = sortedSchools.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  // Summary counts across all fetched schools
  const totalSchoolsCount = rawSchools.length;
  const activeCount = rawSchools.filter((s) => s.status === 'ACTIVE').length;
  const suspendedCount = rawSchools.filter((s) => s.status === 'SUSPENDED').length;
  const totalUsersInTenants = rawSchools.reduce((acc, s) => acc + s.userCount, 0);

  return (
    <AppShell
      title="Schools Directory"
      breadcrumbs={[{ label: 'Platform Super Admin', to: '/super-admin' }, { label: 'Schools' }]}
    >
      <div className="space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading level={2} size="h2">
              Tenant Directory &amp; Setup
            </Heading>
            <Text variant="small" className="mt-1 text-[var(--color-text-secondary)]">
              Multi-tenant institutional registry, domain routing, and cryptographic isolation
              controls.
            </Text>
          </div>
          <div className="flex items-center gap-2.5">
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
              aria-label="Refresh school tenants"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setFormError(null);
                resetCreate();
                setCreateOpen(true);
              }}
            >
              Provision School
            </Button>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption">Total Registered</Text>
              <Building2 className="h-4 w-4 text-[var(--color-brand-primary)]" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {totalSchoolsCount}
            </p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Multi-tenant schools
            </Text>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption">Active Tenants</Text>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Sign-in permitted
            </Text>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption">Suspended</Text>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{suspendedCount}</p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Access blocked
            </Text>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <Text variant="caption">Tenant Population</Text>
              <Users className="h-4 w-4 text-[var(--color-brand-primary)]" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {totalUsersInTenants}
            </p>
            <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
              Users across tenants
            </Text>
          </Card>
        </div>

        {/* Search, Filter Bar and Record Count */}
        <Card padding="md" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="w-full md:max-w-md">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                label="Search schools"
                placeholder="Search by school name, code, or subdomain..."
              />
            </div>

            {/* Status Filter Segmented Controls */}
            <div
              className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-1"
              role="group"
              aria-label="Filter schools by status"
            >
              {(['ALL', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'] as const).map((status) => {
                const isSelected = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={`rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[var(--color-surface-card)] text-[var(--color-brand-primary)] shadow-xs font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Notice & Record Count Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-default)] pt-3 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <strong className="text-[var(--color-text-primary)]">
                  {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>
                –
                <strong className="text-[var(--color-text-primary)]">
                  {Math.min(currentPage * pageSize, totalItems)}
                </strong>{' '}
                of <strong className="text-[var(--color-text-primary)]">{totalItems}</strong> school
                tenants
              </span>
              {(search.trim().length > 0 || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-sm text-[var(--color-brand-primary)] hover:underline ml-2"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              )}
            </div>

            {/* Sort indicator */}
            <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
              <span>Sort:</span>
              <button
                type="button"
                onClick={() => toggleSort(sortField)}
                className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand-primary)] hover:underline"
              >
                {sortField === 'name' && 'School Name'}
                {sortField === 'code' && 'School Code'}
                {sortField === 'createdAt' && 'Registration Date'}
                {sortField === 'userCount' && 'Total Users'}
                {sortField === 'studentCount' && 'Students'}
                <ArrowUpDown className="h-3 w-3" />({sortDirection === 'asc' ? 'Asc' : 'Desc'})
              </button>
            </div>
          </div>
        </Card>

        {/* Directory Content Area */}
        {isError ? (
          <ErrorState
            title="Unable to load schools directory"
            description={
              error instanceof Error ? error.message : 'Failed to communicate with tenant registry.'
            }
            onRetry={() => void refetch()}
          />
        ) : (
          <div className="space-y-4">
            <DataTable
              ariaLabel="School tenants directory"
              loading={isLoading}
              rows={paginatedSchools}
              getRowKey={(row) => row.id}
              emptyTitle="No school tenants found"
              emptyDescription={
                search.trim().length > 0 || statusFilter !== 'ALL'
                  ? 'No school tenants match your current filter criteria. Try adjusting your search query.'
                  : 'No school tenants registered on the platform yet. Click "Provision School" to create the first institution.'
              }
              columns={[
                {
                  key: 'name',
                  header: (
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                    >
                      School Name &amp; Domain <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ),
                  render: (row) => (
                    <div className="space-y-0.5">
                      <Link
                        to={`/super-admin/schools/${row.id}`}
                        className="font-semibold text-[var(--color-brand-primary)] hover:underline flex items-center gap-1.5"
                      >
                        {row.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <span className="font-mono">{row.subdomain}.fsd-sdg4.edu</span>
                        <span>·</span>
                        <span className="font-mono font-medium">{row.code}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'contact',
                  header: 'Institutional Contact',
                  render: (row) => (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                      <Mail className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate max-w-[200px]">{row.contactEmail}</span>
                    </div>
                  ),
                },
                {
                  key: 'users',
                  header: (
                    <button
                      type="button"
                      onClick={() => toggleSort('userCount')}
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                    >
                      Users / Students <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ),
                  render: (row) => (
                    <div className="text-xs space-y-0.5">
                      <div className="font-medium text-[var(--color-text-primary)]">
                        {row.userCount} total users
                      </div>
                      <div className="text-[var(--color-text-muted)]">
                        {row.studentCount} enrolled students
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge
                      variant={
                        row.status === 'ACTIVE'
                          ? 'success'
                          : row.status === 'SUSPENDED'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  key: 'createdAt',
                  header: (
                    <button
                      type="button"
                      onClick={() => toggleSort('createdAt')}
                      className="inline-flex items-center gap-1 font-semibold hover:text-[var(--color-brand-primary)]"
                    >
                      Provisioned <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ),
                  render: (row) => (
                    <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  render: (row) => (
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/super-admin/schools/${row.id}`}>
                        <Button size="sm" variant="outline" aria-label={`Inspect ${row.name}`}>
                          Inspect
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Edit2 className="h-3 w-3" />}
                        onClick={() => openEditModal(row)}
                        aria-label={`Edit ${row.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={row.status === 'ACTIVE' ? 'danger' : 'secondary'}
                        onClick={() => setToggleTarget(row)}
                        aria-label={
                          row.status === 'ACTIVE' ? `Suspend ${row.name}` : `Activate ${row.name}`
                        }
                      >
                        {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border-default)] px-2 pt-4">
                <Text variant="caption">
                  Page <strong className="text-[var(--color-text-primary)]">{currentPage}</strong>{' '}
                  of <strong className="text-[var(--color-text-primary)]">{totalPages}</strong>
                </Text>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Provision New School Tenant */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Provision New School Tenant"
        description="Creates an isolated institutional boundary with dedicated cryptographic session routing and school code."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-school-form"
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Provision School
            </Button>
          </>
        }
      >
        {formError && (
          <Alert
            variant="danger"
            title="Provisioning failed"
            className="mb-4"
            onDismiss={() => setFormError(null)}
          >
            {formError}
          </Alert>
        )}
        <form
          id="create-school-form"
          onSubmit={handleSubmitCreate((values) => createMutation.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="School name"
            error={createErrors.name?.message}
            hint="Full institutional name as recognized by regulatory authorities."
            required
          >
            {(props) => (
              <Input
                {...props}
                {...registerCreate('name')}
                placeholder="e.g. Greenfield Public Academy"
                hasError={Boolean(createErrors.name)}
                autoFocus
              />
            )}
          </FormField>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAutoFillIdentifiers}
              className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-primary)] hover:underline font-medium"
            >
              <Sparkles className="h-3 w-3" /> Auto-suggest Code &amp; Subdomain from Name
            </button>
          </div>

          <FormField
            label="School code"
            error={createErrors.code?.message}
            hint="Unique identifier: uppercase letters, digits, and hyphens (e.g. SCH-GREENFIELD)."
            required
          >
            {(props) => (
              <Input
                {...props}
                {...registerCreate('code')}
                placeholder="e.g. SCH-GREENFIELD"
                hasError={Boolean(createErrors.code)}
                className="uppercase font-mono"
              />
            )}
          </FormField>

          <FormField
            label="Subdomain prefix"
            error={createErrors.subdomain?.message}
            hint="Isolated portal subdomain (e.g. greenfield -> greenfield.fsd-sdg4.edu)."
            required
          >
            {(props) => (
              <div className="relative flex items-center">
                <Input
                  {...props}
                  {...registerCreate('subdomain')}
                  placeholder="e.g. greenfield"
                  hasError={Boolean(createErrors.subdomain)}
                  className="lowercase font-mono pr-36"
                />
                <span className="absolute right-3 text-xs text-[var(--color-text-muted)] pointer-events-none font-mono">
                  .fsd-sdg4.edu
                </span>
              </div>
            )}
          </FormField>

          <FormField
            label="Institutional contact email"
            error={createErrors.contactEmail?.message}
            hint="Primary contact address for administrative notices and root tenant setup."
            required
          >
            {(props) => (
              <Input
                {...props}
                {...registerCreate('contactEmail')}
                type="email"
                placeholder="admin@greenfield.edu"
                hasError={Boolean(createErrors.contactEmail)}
              />
            )}
          </FormField>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
              <UserPlus className="h-4 w-4 text-[var(--color-brand-primary)]" />
              <span>Initial School Administrator (Optional)</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Provisions an initial administrator in inactive status and generates a single-use
              7-day activation link with zero default passwords.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <FormField label="First Name" error={createErrors.adminFirstName?.message}>
                {(props) => (
                  <Input
                    {...props}
                    {...registerCreate('adminFirstName')}
                    placeholder="e.g. Eleanor"
                    hasError={Boolean(createErrors.adminFirstName)}
                  />
                )}
              </FormField>
              <FormField label="Last Name" error={createErrors.adminLastName?.message}>
                {(props) => (
                  <Input
                    {...props}
                    {...registerCreate('adminLastName')}
                    placeholder="e.g. Vance"
                    hasError={Boolean(createErrors.adminLastName)}
                  />
                )}
              </FormField>
            </div>

            <FormField
              label="Admin Email Address"
              error={createErrors.adminEmail?.message}
              hint="The initial administrator will receive activation access via this address."
            >
              {(props) => (
                <Input
                  {...props}
                  {...registerCreate('adminEmail')}
                  type="email"
                  placeholder="e.g. principal@greenfield.edu"
                  hasError={Boolean(createErrors.adminEmail)}
                />
              )}
            </FormField>
          </div>
        </form>
      </Modal>

      {/* Modal: School Provisioning & Invitation Success */}
      <Modal
        open={provisionResult !== null}
        onClose={() => setProvisionResult(null)}
        title="School Tenant & Initial Admin Provisioned"
        description={`School "${provisionResult?.schoolName}" is ready. An initial administrator invitation was created.`}
        footer={
          <Button variant="primary" onClick={() => setProvisionResult(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold">Administrator Account Initialized</p>
              <p className="mt-0.5">
                Target Email: <strong>{provisionResult?.adminEmail}</strong>
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)]">
            Copy and distribute the activation link below to the school administrator. This
            cryptographic token is single-use and will expire in 7 days.
          </p>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
            <label className="block text-[11px] font-semibold uppercase text-[var(--color-text-muted)] mb-1">
              Activation URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={provisionResult?.invitationUrl ?? ''}
                className="w-full rounded border border-[var(--color-border-default)] bg-white px-2.5 py-1.5 font-mono text-xs text-[var(--color-text-primary)]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (provisionResult?.invitationUrl) {
                    await navigator.clipboard.writeText(provisionResult.invitationUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="shrink-0 gap-1"
              >
                {copiedLink ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit School Profile */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Edit ${editTarget?.name ?? 'School Tenant'}`}
        description="Update institutional contact details and operational naming. Identifier code and subdomain are immutable."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-school-form"
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
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
        {editTarget && (
          <form
            id="edit-school-form"
            onSubmit={handleSubmitEdit((values) =>
              updateMutation.mutate({
                id: editTarget.id,
                input: values,
              }),
            )}
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
                <strong>School Code:</strong> <span className="font-mono">{editTarget.code}</span>
              </p>
              <p>
                <strong>Subdomain:</strong>{' '}
                <span className="font-mono">{editTarget.subdomain}.fsd-sdg4.edu</span>
              </p>
              <p className="text-[var(--color-text-muted)] pt-1">
                To maintain database integrity and cryptographic token scoping, subdomain and code
                cannot be changed once provisioned.
              </p>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Dialog: Suspend / Activate School */}
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
          toggleTarget?.status === 'ACTIVE'
            ? `Suspend ${toggleTarget.name}?`
            : `Activate ${toggleTarget?.name ?? ''}?`
        }
        description={
          toggleTarget?.status === 'ACTIVE'
            ? `Suspending "${toggleTarget.name}" immediately blocks all teachers, students, parents, and school administrators belonging to this institution from signing in. All existing academic records, enrollments, and audit logs are safely retained in immutable storage.`
            : `Reactivating "${toggleTarget?.name ?? ''}" restores platform sign-in and educational workflows for all active users of this institution.`
        }
        confirmLabel={
          toggleTarget?.status === 'ACTIVE' ? 'Suspend Tenant Access' : 'Activate Tenant'
        }
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
      />
    </AppShell>
  );
}

export default SchoolsDirectoryPage;
