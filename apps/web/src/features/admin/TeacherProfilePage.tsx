import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  allocateTeacherSchema,
  updateStaffSchema,
  type AllocateTeacherInput,
  type UpdateStaffInput,
} from '@fsd-sdg4/validation';
import type { TeacherAllocationDto } from '@fsd-sdg4/contracts';
import { ArrowLeft, BookOpen, Edit2, History, Plus, RefreshCw, Shield, Trash2 } from 'lucide-react';
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
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import {
  allocateTeacherRequest,
  deallocateTeacherRequest,
  deleteStaffRequest,
  fetchAcademicYears,
  fetchClasses,
  fetchStaffById,
  fetchSubjects,
  updateStaffRequest,
  updateStaffStatusRequest,
} from './schoolAdminApi';

export function TeacherProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Modals & confirmation dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateError, setAllocateError] = useState<string | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deallocateTarget, setDeallocateTarget] = useState<TeacherAllocationDto | null>(null);

  // Queries
  const {
    data: teacher,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['school-admin', 'staff', id],
    queryFn: ({ signal }) => fetchStaffById(id!, signal),
    enabled: Boolean(id),
  });

  const { data: academicYears } = useQuery({
    queryKey: ['school-admin', 'academic-years'],
    queryFn: ({ signal }) => fetchAcademicYears(signal),
    enabled: allocateOpen,
  });

  const { data: subjects } = useQuery({
    queryKey: ['school-admin', 'subjects'],
    queryFn: ({ signal }) => fetchSubjects(signal),
    enabled: allocateOpen,
  });

  const { data: classes } = useQuery({
    queryKey: ['school-admin', 'classes'],
    queryFn: ({ signal }) => fetchClasses(signal),
    enabled: allocateOpen,
  });

  // Edit Form
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

  // Allocation Form
  const {
    register: registerAlloc,
    handleSubmit: handleSubmitAlloc,
    reset: resetAlloc,
    formState: { errors: allocErrors },
  } = useForm<AllocateTeacherInput>({
    resolver: createZodResolver(allocateTeacherSchema),
    defaultValues: {
      academicYearId: '',
      subjectId: '',
      sectionId: '',
      role: 'PRIMARY',
    },
  });

  // Mutations
  const editMutation = useMutation({
    mutationFn: (input: UpdateStaffInput) => updateStaffRequest(id!, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Teacher details updated',
        description: `Profile for ${updated.firstName} ${updated.lastName} has been saved.`,
        variant: 'success',
      });
      setEditOpen(false);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(
        err instanceof ApiClientError ? err.detail : 'Unable to update teacher profile.',
      );
    },
  });

  const allocateMutation = useMutation({
    mutationFn: (input: AllocateTeacherInput) => allocateTeacherRequest(id!, input),
    onSuccess: (alloc) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Course allocation created',
        description: `Assigned to ${alloc.subjectName} (${alloc.className} - ${alloc.sectionName}).`,
        variant: 'success',
      });
      setAllocateOpen(false);
      setAllocateError(null);
      resetAlloc();
    },
    onError: (err) => {
      setAllocateError(
        err instanceof ApiClientError ? err.detail : 'Unable to assign course offering.',
      );
    },
  });

  const deallocateMutation = useMutation({
    mutationFn: (allocationId: string) => deallocateTeacherRequest(id!, allocationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Course allocation removed',
        description: 'Teacher unassigned from course section.',
        variant: 'info',
      });
      setDeallocateTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Deallocation failed',
        description:
          err instanceof ApiClientError ? err.detail : 'Unable to remove course assignment.',
        variant: 'danger',
      });
      setDeallocateTarget(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE' | 'LOCKED') => updateStaffStatusRequest(id!, status),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: updated.status === 'ACTIVE' ? 'Teacher activated' : 'Teacher access suspended',
        description: `${updated.firstName} ${updated.lastName} is now ${updated.status}.`,
        variant: updated.status === 'ACTIVE' ? 'success' : 'warning',
      });
      setStatusConfirmOpen(false);
    },
    onError: (err) => {
      showToast({
        title: 'Status update failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to update status.',
        variant: 'danger',
      });
      setStatusConfirmOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStaffRequest(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Teacher account archived',
        description:
          'Account deactivated. All historical grades and academic records are preserved.',
        variant: 'info',
      });
      navigate('/admin/staff');
    },
    onError: (err) => {
      showToast({
        title: 'Archive failed',
        description:
          err instanceof ApiClientError ? err.detail : 'Unable to archive teacher account.',
        variant: 'danger',
      });
      setDeleteConfirmOpen(false);
    },
  });

  function openEditModal() {
    if (!teacher) return;
    setEditError(null);
    resetEdit({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      specialization: teacher.specialization ?? '',
    });
    setEditOpen(true);
  }

  function openAllocateModal() {
    setAllocateError(null);
    resetAlloc({
      academicYearId: academicYears?.find((y) => y.status === 'ACTIVE')?.id ?? '',
      subjectId: '',
      sectionId: '',
      role: 'PRIMARY',
    });
    setAllocateOpen(true);
  }

  if (isError) {
    return (
      <AppShell
        title="Teacher Profile"
        breadcrumbs={[
          { label: 'School Administrator', to: '/admin' },
          { label: 'Staff & Teachers', to: '/admin/staff' },
          { label: 'Teacher Profile' },
        ]}
      >
        <div className="space-y-4">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Staff Directory
          </Link>
          <ErrorState
            title="Unable to load teacher profile"
            description={
              error instanceof Error ? error.message : 'Teacher profile could not be loaded.'
            }
            onRetry={() => void refetch()}
          />
        </div>
      </AppShell>
    );
  }

  if (isLoading || !teacher) {
    return (
      <AppShell
        title="Teacher Profile"
        breadcrumbs={[
          { label: 'School Administrator', to: '/admin' },
          { label: 'Staff & Teachers', to: '/admin/staff' },
          { label: 'Loading Profile...' },
        ]}
      >
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-sunken)]" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)] lg:col-span-1" />
            <div className="h-64 animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)] lg:col-span-2" />
          </div>
        </div>
      </AppShell>
    );
  }

  // Flatten sections from classes for dropdown select
  const allSections = (classes ?? []).flatMap((c) =>
    c.sections.map((sec) => ({
      ...sec,
      className: c.name,
      stage: c.stage,
    })),
  );

  return (
    <AppShell
      title={`${teacher.firstName} ${teacher.lastName}`}
      breadcrumbs={[
        { label: 'School Administrator', to: '/admin' },
        { label: 'Staff & Teachers', to: '/admin/staff' },
        { label: `${teacher.firstName} ${teacher.lastName}` },
      ]}
    >
      <div className="space-y-6">
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Staff Directory
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="h-4 w-4" />}
              onClick={openEditModal}
            >
              Edit Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openAllocateModal}
            >
              Allocate Course
            </Button>
            <Button
              variant={teacher.status === 'ACTIVE' ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setStatusConfirmOpen(true)}
            >
              {teacher.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4 text-red-600" />}
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-red-600 hover:bg-red-50"
            >
              Archive
            </Button>
          </div>
        </div>

        {/* Hero Identity Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)] text-xl font-bold text-[var(--color-brand-primary)]">
              {teacher.firstName.charAt(0)}
              {teacher.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <Heading level={2} size="h2">
                  {teacher.firstName} {teacher.lastName}
                </Heading>
                <Badge variant={teacher.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {teacher.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {teacher.specialization ? teacher.specialization : 'General Faculty'} · Employee ID:{' '}
                <span className="font-mono font-semibold">{teacher.employeeId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Active Allocations</p>
              <p className="text-xl font-bold text-[var(--color-brand-primary)]">
                {teacher.allocations.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Joined Faculty</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {new Date(teacher.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid: Details + Allocations */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Teacher Identity Card */}
          <div className="space-y-6 lg:col-span-1">
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    Profile &amp; Identity
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={openEditModal}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <dl className="mt-4 divide-y divide-[var(--color-border-default)] text-sm">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Employee ID</dt>
                  <dd className="font-mono font-semibold text-[var(--color-text-primary)]">
                    {teacher.employeeId}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Email</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)] truncate max-w-[180px]">
                    {teacher.email}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Specialization</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)]">
                    {teacher.specialization ?? 'General'}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Account Status</dt>
                  <dd>
                    <Badge variant={teacher.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {teacher.status}
                    </Badge>
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">User ID</dt>
                  <dd className="font-mono text-xs text-[var(--color-text-muted)] truncate max-w-[160px]">
                    {teacher.userId}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Audit History Card */}
            <Card padding="md">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
                <History className="h-4 w-4 text-[var(--color-brand-primary)]" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  Administrative Trail
                </span>
              </div>

              {teacher.recentAuditLogs && teacher.recentAuditLogs.length > 0 ? (
                <div className="mt-3 divide-y divide-[var(--color-border-default)] text-xs">
                  {teacher.recentAuditLogs.map((log) => (
                    <div key={log.id} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {log.action}
                        </span>
                        <span className="text-[var(--color-text-muted)]">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[var(--color-text-muted)] mt-0.5">
                        By: {log.actorEmail ?? 'System Admin'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-[var(--color-text-muted)] text-center">
                  No administrative actions recorded yet.
                </p>
              )}
            </Card>
          </div>

          {/* Right Column: Course & Class Allocations */}
          <div className="space-y-6 lg:col-span-2">
            <Card padding="md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-default)] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--color-brand-primary)]" />
                    Subject &amp; Class Allocations
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Course sections and classrooms assigned to this instructor for academic
                    instruction.
                  </p>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={openAllocateModal}
                >
                  Allocate Course
                </Button>
              </div>

              <div className="mt-4">
                <DataTable
                  ariaLabel="Teacher allocations"
                  rows={teacher.allocations}
                  getRowKey={(a) => a.id}
                  emptyTitle="No courses allocated"
                  emptyDescription="This teacher is not currently assigned to any classroom or subject. Click '+ Allocate Course' to assign course sections."
                  columns={[
                    {
                      key: 'subject',
                      header: 'Subject',
                      render: (a) => (
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {a.subjectName}
                          </p>
                          <p className="font-mono text-xs text-[var(--color-text-muted)]">
                            {a.subjectCode}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'classSection',
                      header: 'Class & Section',
                      render: (a) => (
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {a.className}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            Section {a.sectionName}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'academicYear',
                      header: 'Academic Year',
                      render: (a) => (
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                          {a.academicYearName}
                        </span>
                      ),
                    },
                    {
                      key: 'role',
                      header: 'Role',
                      render: (a) => (
                        <Badge variant={a.role === 'PRIMARY' ? 'brand' : 'neutral'}>{a.role}</Badge>
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Actions',
                      align: 'right',
                      render: (a) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeallocateTarget(a)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Unassign ${a.subjectName} from ${a.sectionName}`}
                        >
                          Remove
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal: Edit Teacher Profile */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit Profile: ${teacher.firstName} ${teacher.lastName}`}
        description="Update personal identification and academic subject specialization."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-teacher-profile-form"
              loading={editMutation.isPending}
              disabled={editMutation.isPending}
            >
              Save Profile
            </Button>
          </>
        }
      >
        {editError && (
          <Alert variant="danger" title="Update failed" className="mb-4">
            {editError}
          </Alert>
        )}
        <form
          id="edit-teacher-profile-form"
          onSubmit={handleSubmitEdit((values) => editMutation.mutate(values))}
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
                placeholder="e.g. Physics, Advanced Calculus"
              />
            )}
          </FormField>

          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3 text-xs">
            <p className="font-semibold text-[var(--color-text-secondary)]">
              Institutional Identity:
            </p>
            <p className="text-[var(--color-text-muted)] mt-1">
              Employee ID: <span className="font-mono font-bold">{teacher.employeeId}</span> ·
              Email: {teacher.email}
            </p>
          </div>
        </form>
      </Modal>

      {/* Modal: Allocate Course Offering */}
      <Modal
        open={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        title="Allocate Course Offering"
        description="Assign this teacher to a classroom cohort and subject for the selected academic year."
        footer={
          <>
            <Button variant="outline" onClick={() => setAllocateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="allocate-course-form"
              loading={allocateMutation.isPending}
              disabled={allocateMutation.isPending}
            >
              Confirm Allocation
            </Button>
          </>
        }
      >
        {allocateError && (
          <Alert variant="danger" title="Allocation failed" className="mb-4">
            {allocateError}
          </Alert>
        )}
        <form
          id="allocate-course-form"
          onSubmit={handleSubmitAlloc((values) => allocateMutation.mutate(values))}
          className="space-y-4"
        >
          <FormField label="Academic year" error={allocErrors.academicYearId?.message} required>
            {(props) => (
              <select
                {...props}
                {...registerAlloc('academicYearId')}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="">Select academic year...</option>
                {academicYears?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.status === 'ACTIVE' ? '(Current Active)' : `(${y.status})`}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Subject" error={allocErrors.subjectId?.message} required>
            {(props) => (
              <select
                {...props}
                {...registerAlloc('subjectId')}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="">Select subject...</option>
                {subjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Class & Section" error={allocErrors.sectionId?.message} required>
            {(props) => (
              <select
                {...props}
                {...registerAlloc('sectionId')}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="">Select classroom section...</option>
                {allSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.className} — Section {sec.name} ({sec.stage})
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Teaching Role" error={allocErrors.role?.message} required>
            {(props) => (
              <select
                {...props}
                {...registerAlloc('role')}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="PRIMARY">Primary Instructor</option>
                <option value="ASSISTANT">Assistant Teacher</option>
              </select>
            )}
          </FormField>
        </form>
      </Modal>

      {/* Confirmation Dialog: Remove Allocation */}
      <ConfirmDialog
        open={deallocateTarget !== null}
        onClose={() => setDeallocateTarget(null)}
        onConfirm={() => {
          if (deallocateTarget) {
            deallocateMutation.mutate(deallocateTarget.id);
          }
        }}
        title="Remove Course Allocation?"
        description={
          deallocateTarget
            ? `Unassign "${teacher.firstName} ${teacher.lastName}" from ${deallocateTarget.subjectName} (${deallocateTarget.className} · Section ${deallocateTarget.sectionName})? Historical grading records will be retained.`
            : ''
        }
        confirmLabel="Remove Allocation"
        variant="danger"
        loading={deallocateMutation.isPending}
      />

      {/* Confirmation Dialog: Suspend / Restore Status */}
      <ConfirmDialog
        open={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={() => {
          statusMutation.mutate(teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
        }}
        title={
          teacher.status === 'ACTIVE'
            ? `Suspend Access for ${teacher.firstName} ${teacher.lastName}?`
            : `Restore Access for ${teacher.firstName} ${teacher.lastName}?`
        }
        description={
          teacher.status === 'ACTIVE'
            ? `Suspending access for "${teacher.firstName} ${teacher.lastName}" blocks platform login immediately. All historic grading records, attendance history, and learning resource evaluations are retained in immutable storage.`
            : `Restoring access enables "${teacher.firstName} ${teacher.lastName}" to resume teaching workflows, grade assessments, and take classroom attendance.`
        }
        confirmLabel={teacher.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
        variant={teacher.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
      />

      {/* Confirmation Dialog: Archive Teacher Record */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Archive ${teacher.firstName} ${teacher.lastName}?`}
        description={`Archiving this faculty member deactivates the user account. In compliance with quality education data policies, all historical student grades, assessment submissions, and course records will remain permanently preserved.`}
        confirmLabel="Archive Teacher"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}

export default TeacherProfilePage;
