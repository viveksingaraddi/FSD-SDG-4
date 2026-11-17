import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserDirectoryItemDto, UserStatus } from '@fsd-sdg4/contracts';
import {
  Building2,
  CheckCircle2,
  Copy,
  Eye,
  History,
  RotateCw,
  Shield,
  ShieldAlert,
  UserPlus,
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
  Input,
  Modal,
  SearchInput,
  Select,
  Skeleton,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError } from '@/lib/apiClient';
import {
  fetchPlatformUserDetail,
  fetchPlatformUsers,
  fetchSchools,
  inviteSchoolAdminRequest,
  updatePlatformUserStatusRequest,
} from './superAdminApi';

type RoleFilter = 'ALL' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export function PlatformUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteSchoolId, setInviteSchoolId] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccessLink, setInviteSuccessLink] = useState<{
    email: string;
    url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Status Change Dialog
  const [statusTarget, setStatusTarget] = useState<UserDirectoryItemDto | null>(null);
  const [statusActionReason, setStatusActionReason] = useState('');

  // User Detail Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch users
  const {
    data: usersResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['super-admin', 'users', search, roleFilter, statusFilter, page],
    queryFn: ({ signal }) =>
      fetchPlatformUsers(
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

  // Fetch active schools for the invite dropdown
  const { data: schoolsData } = useQuery({
    queryKey: ['super-admin', 'schools', 'for-admin-invite'],
    queryFn: ({ signal }) => fetchSchools(undefined, 'ACTIVE', signal),
    enabled: isInviteModalOpen,
  });

  // Fetch detail when selected
  const { data: userDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['super-admin', 'user-detail', selectedUserId],
    queryFn: ({ signal }) => fetchPlatformUserDetail(selectedUserId!, signal),
    enabled: Boolean(selectedUserId),
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: inviteSchoolAdminRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteSchoolId('');
      setInviteError(null);
      if (data.invitationUrl) {
        setInviteSuccessLink({ email: data.email, url: data.invitationUrl });
      } else {
        showToast({
          title: 'Invitation Dispatched',
          description: `Invitation sent to ${data.email}.`,
          variant: 'success',
        });
      }
    },
    onError: (err) => {
      setInviteError(
        err instanceof ApiClientError ? err.message : 'Failed to dispatch invitation.',
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      newStatus,
      reason,
    }: {
      userId: string;
      newStatus: UserStatus;
      reason?: string | undefined;
    }) => updatePlatformUserStatusRequest(userId, newStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['super-admin', 'user-detail', selectedUserId] });
      }
      setStatusTarget(null);
      setStatusActionReason('');
      showToast({
        title: 'Account Status Updated',
        description: 'User access status has been successfully modified.',
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

  const handleCopyLink = async () => {
    if (!inviteSuccessLink) return;
    try {
      await navigator.clipboard.writeText(inviteSuccessLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast({
        title: 'Link Copied',
        description: 'Activation link copied to clipboard.',
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Copy Failed',
        description: 'Please select and copy the link manually.',
        variant: 'danger',
      });
    }
  };

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
        <Badge
          variant={row.role === 'SUPER_ADMIN' ? 'brand' : 'neutral'}
          className="gap-1 font-semibold text-xs"
        >
          {row.role === 'SUPER_ADMIN' ? (
            <Shield className="h-3 w-3 text-purple-600" />
          ) : (
            <Building2 className="h-3 w-3 text-blue-600" />
          )}
          <span>{row.role === 'SUPER_ADMIN' ? 'Super Admin' : 'School Admin'}</span>
        </Badge>
      ),
    },
    {
      key: 'school',
      header: 'Associated Institution',
      render: (row) => (
        <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate max-w-xs block">
          {row.schoolName ?? 'Global Platform Scope'}
        </span>
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
      header: 'Created On',
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
              title="View account detail and lifecycle audit"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Detail</span>
            </Button>
            {row.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusTarget(row)}
                disabled={isSelf}
                title={isSelf ? 'Cannot suspend your own account' : 'Suspend account'}
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
                title="Reactivate account"
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
      title="Platform Users"
      breadcrumbs={[{ label: 'Super Admin', to: '/super-admin' }, { label: 'Platform Users' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Platform User Governance
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Inspect administrators and platform staff, dispatch invitations to active
              institutions, and enforce account access controls.
            </p>
          </div>
          <Button
            variant="primary"
            className="flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm"
            onClick={() => {
              setInviteError(null);
              setIsInviteModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite School Administrator</span>
          </Button>
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
                <option value="SCHOOL_ADMIN">School Admins</option>
                <option value="SUPER_ADMIN">Super Admins</option>
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
                title="Failed to load platform users"
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
                    ? 'No platform users match your selected filters.'
                    : 'No administrators registered yet.'
                }
              />
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={users}
                getRowKey={(row) => row.id}
                ariaLabel="Platform users directory table"
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

      {/* Invite School Administrator Modal */}
      <Modal
        open={isInviteModalOpen}
        onClose={() => {
          if (!inviteMutation.isPending) setIsInviteModalOpen(false);
        }}
        title="Invite School Administrator"
        description="Provision an administrator account and issue a cryptographically signed invitation to an active institution."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={inviteMutation.isPending}
              onClick={() => {
                setInviteError(null);
                if (!inviteSchoolId) {
                  setInviteError('Please select an active school for this administrator.');
                  return;
                }
                if (!inviteEmail.trim() || !inviteFirstName.trim() || !inviteLastName.trim()) {
                  setInviteError('All required fields must be completed.');
                  return;
                }
                inviteMutation.mutate({
                  email: inviteEmail.trim(),
                  firstName: inviteFirstName.trim(),
                  lastName: inviteLastName.trim(),
                  schoolId: inviteSchoolId,
                });
              }}
            >
              Issue Invitation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {inviteError && (
            <Alert variant="danger" title="Invitation Failed">
              {inviteError}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Target Institution *
            </label>
            <Select
              value={inviteSchoolId}
              onChange={(e) => setInviteSchoolId(e.target.value)}
              className="w-full text-sm"
              aria-label="Select target school"
            >
              <option value="">Select an active school...</option>
              {schoolsData?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Only active institutions can accept administrator invitations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Administrator Email *
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. principal@school.edu"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                First Name *
              </label>
              <Input
                type="text"
                value={inviteFirstName}
                onChange={(e) => setInviteFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Last Name *
              </label>
              <Input
                type="text"
                value={inviteLastName}
                onChange={(e) => setInviteLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Success Link Modal */}
      {inviteSuccessLink && (
        <Modal
          open={Boolean(inviteSuccessLink)}
          onClose={() => setInviteSuccessLink(null)}
          title="Invitation Generated"
          description={`An invitation was successfully issued for ${inviteSuccessLink.email}. Share this secure single-use activation link with the recipient.`}
          footer={
            <Button variant="primary" onClick={() => setInviteSuccessLink(null)}>
              Done
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-[var(--color-surface-sunken)] rounded-md border border-[var(--color-border-default)]">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                ACTIVATION URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteSuccessLink.url}
                  className="font-mono text-xs bg-[var(--color-surface-canvas)]"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleCopyLink}
                  className="shrink-0 gap-1"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              The link is valid for 7 days. Once the administrator sets their password, their
              account will transition to Active.
            </p>
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
              ? 'Suspending this account will immediately revoke all active sessions and block further authentication until reactivated.'
              : 'Reactivating this account will restore administrator login privileges.'
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
          description="Detailed institutional governance view and access audit history."
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
                  <span className="text-[var(--color-text-muted)] block">Institution</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {userDetail.schoolName ?? 'Global Platform Scope'}
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

              {/* Zero-trust student privacy disclosure */}
              <Alert variant="info" title="Privacy Governance">
                In strict adherence to zero-trust institutional privacy, platform administrators
                cannot inspect private student learning records or classroom submissions through
                this module.
              </Alert>

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

export default PlatformUsersPage;
