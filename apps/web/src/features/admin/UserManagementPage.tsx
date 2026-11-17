import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { UserDirectoryItemDto, UserStatus } from '@fsd-sdg4/contracts';
import {
  CheckCircle2,
  Eye,
  GraduationCap,
  HeartHandshake,
  History,
  Link as LinkIcon,
  RotateCw,
  ShieldAlert,
  Unlink,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  EmptyState,
  ErrorState,
  Modal,
  SearchInput,
  Select,
  Skeleton,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError } from '@/lib/apiClient';
import {
  fetchSchoolUserDetail,
  fetchSchoolUsers,
  linkStudentGuardianRequest,
  unlinkStudentGuardianRequest,
  updateSchoolUserStatusRequest,
} from './schoolAdminApi';

type RoleFilter = 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Status Change Dialog
  const [statusTarget, setStatusTarget] = useState<UserDirectoryItemDto | null>(null);
  const [statusActionReason, setStatusActionReason] = useState('');

  // User Detail Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Link Guardian Modal
  const [linkingStudent, setLinkingStudent] = useState<UserDirectoryItemDto | null>(null);
  const [selectedGuardianUserId, setSelectedGuardianUserId] = useState('');
  const [relationshipType, setRelationshipType] = useState<
    'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER'
  >('MOTHER');
  const [isPrimaryContact, setIsPrimaryContact] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Fetch users
  const {
    data: usersResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['school-admin', 'users', search, roleFilter, statusFilter, page],
    queryFn: ({ signal }) =>
      fetchSchoolUsers(
        {
          search: search.trim() || undefined,
          role: roleFilter,
          status: statusFilter,
          page,
          limit: pageSize,
        },
        signal,
      ),
  });

  // Fetch active parents for the guardian link dropdown
  const { data: parentsResult } = useQuery({
    queryKey: ['school-admin', 'parents-for-linking'],
    queryFn: ({ signal }) =>
      fetchSchoolUsers(
        {
          role: 'PARENT',
          status: 'ACTIVE',
          limit: 100,
        },
        signal,
      ),
    enabled: Boolean(linkingStudent),
  });

  // Fetch user detail
  const { data: userDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['school-admin', 'user-detail', selectedUserId],
    queryFn: ({ signal }) => fetchSchoolUserDetail(selectedUserId!, signal),
    enabled: Boolean(selectedUserId),
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      newStatus,
      reason,
    }: {
      userId: string;
      newStatus: UserStatus;
      reason?: string | undefined;
    }) => updateSchoolUserStatusRequest(userId, newStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-admin', 'users'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({
          queryKey: ['school-admin', 'user-detail', selectedUserId],
        });
      }
      setStatusTarget(null);
      setStatusActionReason('');
      showToast({
        title: 'User Status Updated',
        description: 'Account access privileges have been successfully updated.',
        variant: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Status Update Failed',
        description: err instanceof ApiClientError ? err.message : 'Failed to update user status.',
        variant: 'danger',
      });
    },
  });

  // Link guardian mutation
  const linkMutation = useMutation({
    mutationFn: ({
      studentId,
      guardianUserId,
      relType,
      isPrimary,
    }: {
      studentId: string;
      guardianUserId: string;
      relType: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER';
      isPrimary: boolean;
    }) =>
      linkStudentGuardianRequest(studentId, {
        guardianUserId,
        relationshipType: relType,
        isPrimaryContact: isPrimary,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-admin', 'users'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({
          queryKey: ['school-admin', 'user-detail', selectedUserId],
        });
      }
      setLinkingStudent(null);
      setSelectedGuardianUserId('');
      setLinkError(null);
      showToast({
        title: 'Guardian Linked',
        description: 'Parent/guardian relationship has been established.',
        variant: 'success',
      });
    },
    onError: (err) => {
      setLinkError(err instanceof ApiClientError ? err.message : 'Failed to link guardian.');
    },
  });

  // Unlink guardian mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ studentId, guardianUserId }: { studentId: string; guardianUserId: string }) =>
      unlinkStudentGuardianRequest(studentId, guardianUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-admin', 'users'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({
          queryKey: ['school-admin', 'user-detail', selectedUserId],
        });
      }
      showToast({
        title: 'Guardian Unlinked',
        description: 'Relationship removed successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Unlink Failed',
        description: err instanceof ApiClientError ? err.message : 'Failed to unlink guardian.',
        variant: 'danger',
      });
    },
  });

  const users = usersResult?.items ?? [];
  const total = usersResult?.total ?? 0;
  const totalPages = usersResult?.totalPages ?? 1;

  const columns: DataTableColumn<UserDirectoryItemDto>[] = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center font-bold text-sm shrink-0">
            {row.firstName?.[0] || row.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-text-primary)] truncate">
              {row.firstName ? `${row.firstName} ${row.lastName}` : 'Pending Setup'}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant="neutral" className="gap-1 font-semibold text-xs">
          {row.role === 'TEACHER' && <Users className="h-3 w-3 text-blue-600" />}
          {row.role === 'STUDENT' && <GraduationCap className="h-3 w-3 text-emerald-600" />}
          {row.role === 'PARENT' && <HeartHandshake className="h-3 w-3 text-purple-600" />}
          <span>{row.role}</span>
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (row.status === 'ACTIVE') {
          return (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Active</span>
            </Badge>
          );
        }
        if (row.status === 'LOCKED') {
          return (
            <Badge variant="warning" className="gap-1">
              <ShieldAlert className="h-3 w-3" />
              <span>Suspended</span>
            </Badge>
          );
        }
        return (
          <Badge variant="danger" className="gap-1">
            <UserX className="h-3 w-3" />
            <span>Inactive</span>
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (row) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const isSelf = currentUser?.id === row.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserId(row.id)}
              className="gap-1 text-xs"
              title="View account detail and lifecycle"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Detail</span>
            </Button>
            {row.role === 'STUDENT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLinkingStudent(row);
                  setSelectedGuardianUserId('');
                  setLinkError(null);
                }}
                className="gap-1 text-xs text-purple-700 hover:text-purple-800"
                title="Link parent or guardian"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Link Guardian</span>
              </Button>
            )}
            {row.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusTarget(row)}
                disabled={isSelf}
                title={isSelf ? 'Cannot suspend your own account' : 'Suspend user'}
                className="gap-1 text-xs text-amber-700 hover:text-amber-800"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Suspend</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusTarget(row)}
                disabled={isSelf}
                className="gap-1 text-xs text-emerald-700 hover:text-emerald-800"
                title="Reactivate user"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Reactivate</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AppShell
      title="User Directory"
      breadcrumbs={[{ label: 'Admin Portal', to: '/admin' }, { label: 'User Directory' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              School User Directory & Lifecycle
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Oversee faculty, student, and guardian accounts, manage account status, and configure
              student guardian associations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/invitations">
              <Button variant="primary" className="flex items-center gap-2 shadow-sm">
                <UserPlus className="h-4 w-4" />
                <span>Manage Invitations</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <Card padding="md" className="border-[var(--color-border-default)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 max-w-sm">
              <SearchInput
                placeholder="Search by name or email..."
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as RoleFilter);
                  setPage(1);
                }}
                className="w-40 text-xs"
                aria-label="Filter by role"
              >
                <option value="ALL">All Roles</option>
                <option value="TEACHER">Teachers</option>
                <option value="STUDENT">Students</option>
                <option value="PARENT">Parents</option>
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className="w-36 text-xs"
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="LOCKED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh user directory"
                className="gap-1 text-xs"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card padding="none" className="border-[var(--color-border-default)] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load school users"
                description={
                  error instanceof Error ? error.message : 'An unexpected error occurred.'
                }
                onRetry={() => refetch()}
              />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="No users found"
                description={
                  search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'No users match your selected filters.'
                    : 'Get started by inviting teachers, students, or parents.'
                }
              />
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={users}
                getRowKey={(row) => row.id}
                ariaLabel="School users directory table"
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border-default)] bg-[var(--color-surface-sunken)]/30 text-xs text-[var(--color-text-secondary)]">
                  <div>
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{' '}
                    {total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Link Guardian Modal */}
      {linkingStudent && (
        <Modal
          open={Boolean(linkingStudent)}
          onClose={() => {
            if (!linkMutation.isPending) setLinkingStudent(null);
          }}
          title={`Link Guardian to ${linkingStudent.firstName ?? ''} ${linkingStudent.lastName ?? linkingStudent.email}`}
          description="Establish an authorized parental or guardian relationship within this institution."
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkingStudent(null)}
                disabled={linkMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={linkMutation.isPending}
                onClick={() => {
                  setLinkError(null);
                  if (!selectedGuardianUserId) {
                    setLinkError('Please select a registered parent user.');
                    return;
                  }
                  linkMutation.mutate({
                    studentId: linkingStudent.id,
                    guardianUserId: selectedGuardianUserId,
                    relType: relationshipType,
                    isPrimary: isPrimaryContact,
                  });
                }}
              >
                Link Relationship
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {linkError && (
              <Alert variant="danger" title="Linking Failed">
                {linkError}
              </Alert>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Parent / Guardian Account *
              </label>
              <Select
                value={selectedGuardianUserId}
                onChange={(e) => setSelectedGuardianUserId(e.target.value)}
                className="w-full text-sm"
                aria-label="Select parent user"
              >
                <option value="">Select a registered parent...</option>
                {parentsResult?.items.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.firstName
                      ? `${parent.firstName} ${parent.lastName}`
                      : 'Registered Parent'}{' '}
                    ({parent.email})
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                If the parent is not listed, issue an invitation via Invitations management first.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Relationship Type *
              </label>
              <Select
                value={relationshipType}
                onChange={(e) =>
                  setRelationshipType(
                    e.target.value as 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER',
                  )
                }
                className="w-full text-sm"
                aria-label="Select relationship type"
              >
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
                <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                <option value="OTHER">Other Caregiver</option>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryContact"
                checked={isPrimaryContact}
                onChange={(e) => setIsPrimaryContact(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
              />
              <label
                htmlFor="isPrimaryContact"
                className="text-xs font-medium text-[var(--color-text-primary)] cursor-pointer"
              >
                Designate as Primary Emergency & Academic Contact
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Confirmation Dialog */}
      {statusTarget && (
        <ConfirmDialog
          open={Boolean(statusTarget)}
          onClose={() => {
            if (!statusMutation.isPending) {
              setStatusTarget(null);
              setStatusActionReason('');
            }
          }}
          title={
            statusTarget.status === 'ACTIVE'
              ? `Suspend Account: ${statusTarget.email}`
              : `Reactivate Account: ${statusTarget.email}`
          }
          description={
            statusTarget.status === 'ACTIVE'
              ? 'Suspending this user will revoke active sessions and prevent further portal access.'
              : 'Reactivating this user will restore their portal access privileges.'
          }
          confirmLabel={statusTarget.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
          variant={statusTarget.status === 'ACTIVE' ? 'danger' : 'primary'}
          loading={statusMutation.isPending}
          onConfirm={() => {
            statusMutation.mutate({
              userId: statusTarget.id,
              newStatus: statusTarget.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
              reason: statusActionReason.trim() || undefined,
            });
          }}
        />
      )}

      {/* User Detail & Audit Modal */}
      {selectedUserId && (
        <Modal
          open={Boolean(selectedUserId)}
          onClose={() => setSelectedUserId(null)}
          title="User Account & Lifecycle Details"
          description="Detailed institutional identity and access audit trail."
          footer={
            <Button variant="outline" onClick={() => setSelectedUserId(null)}>
              Close
            </Button>
          }
        >
          {isLoadingDetail || !userDetail ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--color-surface-sunken)]/50 rounded-lg border border-[var(--color-border-default)] text-xs">
                <div>
                  <span className="text-[var(--color-text-muted)] block">Email</span>
                  <span className="font-semibold text-[var(--color-text-primary)] break-all">
                    {userDetail.email}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Role</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {userDetail.role}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Account Status</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {userDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Created</span>
                  <span className="text-[var(--color-text-primary)]">
                    {new Date(userDetail.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Last Login</span>
                  <span className="text-[var(--color-text-primary)]">
                    {userDetail.lastLoginAt
                      ? new Date(userDetail.lastLoginAt).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              {/* Linked Guardians or Students if applicable */}
              {userDetail.studentGuardians && userDetail.studentGuardians.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                    <HeartHandshake className="h-3.5 w-3.5 text-purple-600" />
                    <span>Linked Guardians</span>
                  </h4>
                  <div className="divide-y divide-[var(--color-border-default)] border border-[var(--color-border-default)] rounded-md overflow-hidden text-xs">
                    {userDetail.studentGuardians.map((g) => (
                      <div
                        key={g.id}
                        className="p-2.5 bg-[var(--color-surface-elevated)] flex justify-between items-center gap-2"
                      >
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {g.guardianName} ({g.guardianEmail}) — {g.relationshipType}
                            {g.isPrimaryContact && (
                              <Badge variant="brand" className="ml-2 text-[10px] py-0 px-1">
                                Primary
                              </Badge>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (confirm('Unlink this guardian from the student?')) {
                              unlinkMutation.mutate({
                                studentId: userDetail.id,
                                guardianUserId: g.guardianUserId,
                              });
                            }
                          }}
                          className="p-1 h-auto text-xs"
                          title="Unlink guardian"
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Audit Events */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" />
                  <span>Account Lifecycle History</span>
                </h4>
                {!userDetail.recentAuditLogs || userDetail.recentAuditLogs.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] italic">
                    No administrative audit events recorded for this account.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--color-border-default)] border border-[var(--color-border-default)] rounded-md overflow-hidden text-xs">
                    {userDetail.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-[var(--color-surface-elevated)] flex justify-between items-center gap-2"
                      >
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {log.action}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            By {log.actorEmail ?? 'System'}
                          </p>
                        </div>
                        <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </AppShell>
  );
}

export default UserManagementPage;
