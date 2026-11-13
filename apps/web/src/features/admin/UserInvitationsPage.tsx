import { useEffect, useState, type FormEvent } from 'react';
import type { UserInvitationDto } from '@fsd-sdg4/contracts';
import type { InvitationFilterQuery } from '@fsd-sdg4/validation';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  GraduationCap,
  HeartHandshake,
  Mail,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Button, Card, Input, Modal, Select, Skeleton, useToast } from '@/components/ui';
import {
  fetchSchoolInvitations,
  inviteSchoolUserRequest,
  resendSchoolInvitationRequest,
  revokeSchoolInvitationRequest,
} from './schoolAdminApi';

export function UserInvitationsPage() {
  const { showToast } = useToast();

  const [invitations, setInvitations] = useState<UserInvitationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'TEACHER' | 'STUDENT' | 'PARENT'>('TEACHER');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success Link Dialog
  const [successLink, setSuccessLink] = useState<{
    email: string;
    url: string;
    deliveryStatus?: string | undefined;
    deliveryError?: string | null | undefined;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Action Loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadInvitations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSchoolInvitations({
        search: search.trim() || undefined,
        status: statusFilter as InvitationFilterQuery['status'],
        role: roleFilter as InvitationFilterQuery['role'],
      });
      setInvitations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [statusFilter, roleFilter]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadInvitations();
  };

  const handleCreateInvite = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await inviteSchoolUserRequest({
        role: inviteRole,
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim(),
        lastName: inviteLastName.trim(),
        ...(inviteRole === 'TEACHER'
          ? {
              employeeId: employeeId.trim() || undefined,
              specialization: specialization.trim() || undefined,
            }
          : {}),
        ...(inviteRole === 'STUDENT'
          ? {
              studentIdNumber: studentIdNumber.trim() || undefined,
              admissionDate,
            }
          : {}),
      });

      setIsInviteModalOpen(false);
      resetInviteForm();
      loadInvitations();

      if (result.invitationUrl) {
        setSuccessLink({
          email: result.email,
          url: result.invitationUrl,
          deliveryStatus: result.deliveryStatus,
          deliveryError: result.deliveryError,
        });
      } else {
        showToast({
          title: 'Invitation Sent',
          description: `Invitation issued to ${result.email}.`,
          variant: 'success',
        });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to issue invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setEmployeeId('');
    setSpecialization('');
    setStudentIdNumber('');
    setFormError(null);
  };

  const handleResend = async (invitation: UserInvitationDto) => {
    setActionLoadingId(invitation.id);
    try {
      const result = await resendSchoolInvitationRequest(invitation.id);
      loadInvitations();
      if (result.invitationUrl) {
        setSuccessLink({
          email: result.email,
          url: result.invitationUrl,
          deliveryStatus: result.deliveryStatus,
          deliveryError: result.deliveryError,
        });
      } else {
        showToast({
          title: 'Invitation Resent',
          description: `Fresh invitation token generated for ${invitation.email}.`,
          variant: 'success',
        });
      }
    } catch (err) {
      showToast({
        title: 'Resend Failed',
        description: err instanceof Error ? err.message : 'Could not resend invitation.',
        variant: 'danger',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (invitation: UserInvitationDto) => {
    if (
      !window.confirm(`Are you sure you want to revoke the invitation for ${invitation.email}?`)
    ) {
      return;
    }

    setActionLoadingId(invitation.id);
    try {
      await revokeSchoolInvitationRequest(invitation.id);
      showToast({
        title: 'Invitation Revoked',
        description: `Invitation for ${invitation.email} has been cancelled.`,
        variant: 'info',
      });
      loadInvitations();
    } catch (err) {
      showToast({
        title: 'Revocation Failed',
        description: err instanceof Error ? err.message : 'Could not revoke invitation.',
        variant: 'danger',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast({
        title: 'Copied to Clipboard',
        description: 'Invitation link copied.',
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Copy Failed',
        description: 'Please manually copy the link from the text box.',
        variant: 'danger',
      });
    }
  };

  const counts = {
    total: invitations.length,
    pending: invitations.filter((i) => i.status === 'PENDING').length,
    accepted: invitations.filter((i) => i.status === 'ACCEPTED').length,
    expired: invitations.filter((i) => i.status === 'EXPIRED').length,
    revoked: invitations.filter((i) => i.status === 'REVOKED').length,
  };

  return (
    <AppShell
      title="User Invitations & Provisioning"
      breadcrumbs={[{ label: 'Admin Portal', to: '/admin' }, { label: 'Invitations' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              User Invitations & Provisioning
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Issue secure single-use account invitations to Teachers, Students, and Parents with
              cryptographic verification and zero default passwords.
            </p>
          </div>
          <Button
            variant="primary"
            className="flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite New User</span>
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card padding="md" className="border-[var(--color-border-default)]">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Issued</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {counts.total}
            </p>
          </Card>
          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>Pending Activation</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-700">{counts.pending}</p>
          </Card>
          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Accepted & Active</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.accepted}</p>
          </Card>
          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Expired / Revoked</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-700">
              {counts.expired + counts.revoked}
            </p>
          </Card>
        </div>

        {/* Filters Bar */}
        <Card padding="md" className="border-[var(--color-border-default)]">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Input
                  type="search"
                  placeholder="Search by recipient email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Search
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36 text-xs"
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Revoked</option>
              </Select>

              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-36 text-xs"
                aria-label="Filter by role"
              >
                <option value="ALL">All Roles</option>
                <option value="TEACHER">Teachers</option>
                <option value="STUDENT">Students</option>
                <option value="PARENT">Parents</option>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={loadInvitations}
                title="Refresh list"
                aria-label="Refresh list"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>

        {/* Table Card */}
        <Card padding="none" className="border-[var(--color-border-default)] shadow-sm">
          <div className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] px-6 py-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Issued Invitations Directory
            </h2>
          </div>
          <div>
            {isLoading ? (
              <div className="space-y-3 p-6" aria-busy="true">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadInvitations}
                  className="mt-4 inline-flex"
                >
                  Try Again
                </Button>
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-12 text-center text-[var(--color-text-secondary)]">
                <Mail className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-3" />
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  No invitations found
                </h3>
                <p className="mt-1 text-sm">
                  {search || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                    ? 'No invitations match your selected filters.'
                    : 'Get started by inviting teachers, students, or parents to your school.'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Invite First User
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)]/50 text-xs font-semibold text-[var(--color-text-secondary)]">
                      <th className="py-3.5 px-4 sm:px-6">Recipient Email</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Email Delivery</th>
                      <th className="py-3.5 px-4">Expires</th>
                      <th className="py-3.5 px-4">Issued On</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-default)]">
                    {invitations.map((inv) => {
                      const isExpired =
                        inv.status === 'EXPIRED' ||
                        (inv.status === 'PENDING' && new Date() > new Date(inv.expiresAt));

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-[var(--color-surface-sunken)]/40 transition-colors"
                        >
                          <td className="py-3 px-4 sm:px-6 font-medium text-[var(--color-text-primary)]">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                              <span className="truncate max-w-xs">{inv.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
                              {inv.role === 'TEACHER' && (
                                <Users className="h-3.5 w-3.5 text-blue-600" />
                              )}
                              {inv.role === 'STUDENT' && (
                                <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                              {inv.role === 'PARENT' && (
                                <HeartHandshake className="h-3.5 w-3.5 text-purple-600" />
                              )}
                              <span>{inv.role}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {inv.status === 'ACCEPTED' && (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Accepted</span>
                              </Badge>
                            )}
                            {inv.status === 'PENDING' && !isExpired && (
                              <Badge variant="warning" className="gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="danger" className="gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Expired</span>
                              </Badge>
                            )}
                            {inv.status === 'REVOKED' && (
                              <Badge variant="neutral" className="gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                <span>Revoked</span>
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {inv.deliveryStatus === 'SENT' && (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Delivered</span>
                              </Badge>
                            )}
                            {inv.deliveryStatus === 'FAILED' && (
                              <Badge
                                variant="danger"
                                className="gap-1 cursor-help"
                                title={inv.deliveryError ?? 'SMTP delivery failed'}
                              >
                                <AlertCircle className="h-3 w-3" />
                                <span>Failed</span>
                              </Badge>
                            )}
                            {(!inv.deliveryStatus || inv.deliveryStatus === 'PENDING') && (
                              <Badge variant="neutral" className="gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--color-text-secondary)]">
                            {new Date(inv.expiresAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--color-text-secondary)]">
                            {new Date(inv.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status !== 'ACCEPTED' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResend(inv)}
                                    disabled={actionLoadingId === inv.id}
                                    title="Resend invitation (invalidates old link)"
                                    className="gap-1 text-xs"
                                  >
                                    <RotateCw
                                      className={`h-3.5 w-3.5 ${actionLoadingId === inv.id ? 'animate-spin' : ''}`}
                                    />
                                    <span>Resend</span>
                                  </Button>
                                  {inv.status !== 'REVOKED' && (
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleRevoke(inv)}
                                      disabled={actionLoadingId === inv.id}
                                      title="Revoke invitation"
                                      className="p-1.5 text-xs"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {inv.status === 'ACCEPTED' && (
                                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5" /> Activated
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Modal 1: Issue New Invitation */}
        <Modal
          open={isInviteModalOpen}
          onClose={() => !isSubmitting && setIsInviteModalOpen(false)}
          title="Provision New User Account"
          description="Create an inactive user profile and generate a single-use 7-day cryptographic invitation token."
          footer={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="invite-user-form"
                variant="primary"
                loading={isSubmitting}
              >
                Issue Invitation
              </Button>
            </div>
          }
        >
          <form id="invite-user-form" onSubmit={handleCreateInvite} className="space-y-4">
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                User Role *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['TEACHER', 'STUDENT', 'PARENT'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={`flex flex-col items-center justify-center rounded-[var(--radius-md)] border p-2.5 text-xs font-medium transition-colors ${
                      inviteRole === r
                        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]'
                        : 'border-[var(--color-border-default)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {r === 'TEACHER' && <Users className="h-5 w-5 mb-1" />}
                    {r === 'STUDENT' && <GraduationCap className="h-5 w-5 mb-1" />}
                    {r === 'PARENT' && <HeartHandshake className="h-5 w-5 mb-1" />}
                    <span>
                      {r === 'TEACHER' ? 'Teacher' : r === 'STUDENT' ? 'Student' : 'Parent'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Institutional / Contact Email *
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. user@school.edu"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  First Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="First name"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Last Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Last name"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Role specific fields */}
            {inviteRole === 'TEACHER' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Employee ID (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Specialization / Subject
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>
              </div>
            )}

            {inviteRole === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Student ID (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={studentIdNumber}
                    onChange={(e) => setStudentIdNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Admission Date
                  </label>
                  <Input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </form>
        </Modal>

        {/* Modal 2: Generated Invitation Link Dialog */}
        <Modal
          open={!!successLink}
          onClose={() => setSuccessLink(null)}
          title="Invitation Ready"
          description={`An account invitation was issued for ${successLink?.email ?? ''}.`}
          footer={
            <Button variant="primary" onClick={() => setSuccessLink(null)}>
              Done
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Share this single-use activation link with the recipient. The link is valid for 7 days
              and allows them to create their password securely.
            </p>

            {successLink?.deliveryStatus === 'SENT' && (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Invitation email successfully dispatched to <strong>{successLink.email}</strong>{' '}
                  via Gmail SMTP.
                </span>
              </div>
            )}

            {successLink?.deliveryStatus === 'FAILED' && (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Automatic email transmission encountered an issue (
                  {successLink.deliveryError ?? 'SMTP error'}). Please share the link manually.
                </span>
              </div>
            )}

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3">
              <label className="block text-[11px] font-semibold uppercase text-[var(--color-text-muted)] mb-1">
                Activation URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={successLink?.url ?? ''}
                  className="w-full rounded border border-[var(--color-border-default)] bg-white px-2.5 py-1.5 font-mono text-xs text-[var(--color-text-primary)]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => successLink && copyToClipboard(successLink.url)}
                  className="shrink-0 gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}

export default UserInvitationsPage;
