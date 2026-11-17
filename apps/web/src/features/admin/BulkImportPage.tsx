import { useEffect, useState } from 'react';
import type { BulkImportCategory, BulkImportJobDto, BulkImportStatus } from '@fsd-sdg4/contracts';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HeartHandshake,
  History,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Button, Card, Heading, Select, Skeleton, Text, useToast } from '@/components/ui';
import { BulkImportModal } from './BulkImportModal';
import { downloadJobErrorReport, fetchImportJobs } from './bulkImportApi';
import { InvitationPreviewModal } from './InvitationPreviewModal';

export function BulkImportPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'NEW_IMPORT' | 'HISTORY'>('NEW_IMPORT');
  const [selectedCategory, setSelectedCategory] = useState<BulkImportCategory>('STUDENTS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewEmailOpen, setIsPreviewEmailOpen] = useState(false);

  // History state
  const [jobs, setJobs] = useState<BulkImportJobDto[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    setJobsError(null);
    try {
      const res = await fetchImportJobs({
        category: categoryFilter !== 'ALL' ? (categoryFilter as BulkImportCategory) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as BulkImportStatus) : undefined,
        limit: 25,
      });
      setJobs(res.items);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to load past import jobs.');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [categoryFilter, statusFilter]);

  // Aggregate metrics from past jobs
  const metrics = {
    totalJobs: jobs.length,
    totalRecords: jobs.reduce((acc, j) => acc + j.successfulRows, 0),
    totalInvitations: jobs.reduce((acc, j) => acc + j.invitationsCreated, 0),
    emailsDelivered: jobs.reduce((acc, j) => acc + j.invitationsSent, 0),
  };

  const deliveryRate =
    metrics.totalInvitations > 0
      ? Math.round((metrics.emailsDelivered / metrics.totalInvitations) * 100)
      : 100;

  return (
    <AppShell
      title="Bulk Onboarding & Import"
      breadcrumbs={[{ label: 'Admin Portal', to: '/admin' }, { label: 'Bulk Import' }]}
    >
      <div className="space-y-6">
        {/* Header and Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading level={1} size="h2">
              Institutional Bulk Onboarding
            </Heading>
            <Text variant="muted" className="mt-1">
              Import students, faculty members, and parent guardians via spreadsheets with automated
              email invitation approval.
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewEmailOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span>Preview Invitations</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedCategory('STUDENTS');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Start New Import</span>
            </Button>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span>Import Batches</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
              {metrics.totalJobs}
            </p>
          </Card>

          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Records Created</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{metrics.totalRecords}</p>
          </Card>

          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>Invitations Issued</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-700">{metrics.totalInvitations}</p>
          </Card>

          <Card padding="md" className="border-[var(--color-border-default)]">
            <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span>Email Delivery Rate</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-purple-700">{deliveryRate}%</p>
          </Card>
        </div>

        {/* Main Tab Switcher */}
        <div className="border-b border-[var(--color-border-default)]">
          <nav className="flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab('NEW_IMPORT')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'NEW_IMPORT'
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Onboarding Categories</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'HISTORY'
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Import History &amp; Audit</span>
            </button>
          </nav>
        </div>

        {/* TAB 1: ONBOARDING CATEGORIES */}
        {activeTab === 'NEW_IMPORT' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Student Card */}
            <Card
              padding="lg"
              className="border-[var(--color-border-default)] hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <Badge variant="success">Students</Badge>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--color-text-primary)]">
                  Bulk Student Import
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Import hundreds of student records, assign them to active classes and sections,
                  register student identifiers, and automatically issue student portal access.
                </p>
                <div className="mt-4 pt-3 border-t border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] space-y-1">
                  <div>• Required: First Name, Last Name, Student ID, Email, Class, Section</div>
                  <div>• Supports CSV and XLSX spreadsheets</div>
                  <div>• In-file duplicate checking &amp; relational verification</div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedCategory('STUDENTS');
                    setIsModalOpen(true);
                  }}
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Import Students</span>
                </Button>
              </div>
            </Card>

            {/* Staff Card */}
            <Card
              padding="lg"
              className="border-[var(--color-border-default)] hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                    <Users className="h-6 w-6" />
                  </div>
                  <Badge variant="neutral">Faculty &amp; Staff</Badge>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--color-text-primary)]">
                  Bulk Faculty &amp; Staff Import
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Onboard teachers, department heads, and academic specialists. Assign Employee IDs
                  and specializations with immediate invitation dispatch.
                </p>
                <div className="mt-4 pt-3 border-t border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] space-y-1">
                  <div>• Required: First Name, Last Name, Email, Employee ID, Specialization</div>
                  <div>• Role-based access to attendance &amp; gradebook</div>
                  <div>• Single-use activation with cryptographic validation</div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedCategory('TEACHERS');
                    setIsModalOpen(true);
                  }}
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Import Faculty &amp; Staff</span>
                </Button>
              </div>
            </Card>

            {/* Parent Card */}
            <Card
              padding="lg"
              className="border-[var(--color-border-default)] hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-purple-50 p-2.5 text-purple-700">
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <Badge variant="warning">Family &amp; Guardians</Badge>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--color-text-primary)]">
                  Bulk Parent / Guardian Import
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Link parents and legal guardians directly to their enrolled students. Establish
                  primary contact permissions and activate family visibility.
                </p>
                <div className="mt-4 pt-3 border-t border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] space-y-1">
                  <div>• Required: First Name, Last Name, Parent Email, Student ID Number</div>
                  <div>• Enforces student enrollment within your school tenant</div>
                  <div>• Automated portal invitations with real-time tracking</div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedCategory('PARENTS');
                    setIsModalOpen(true);
                  }}
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Import Parents &amp; Guardians</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: IMPORT HISTORY & AUDIT */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <Card padding="sm" className="border-[var(--color-border-default)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-48">
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      options={[
                        { value: 'ALL', label: 'All Categories' },
                        { value: 'STUDENTS', label: 'Students' },
                        { value: 'TEACHERS', label: 'Faculty & Staff' },
                        { value: 'PARENTS', label: 'Parents / Guardians' },
                      ]}
                    />
                  </div>
                  <div className="w-44">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      options={[
                        { value: 'ALL', label: 'All Statuses' },
                        { value: 'COMPLETED', label: 'Completed' },
                        { value: 'FAILED', label: 'Failed' },
                        { value: 'PROCESSING', label: 'Processing' },
                      ]}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadJobs}
                  className="flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh History</span>
                </Button>
              </div>
            </Card>

            {/* Jobs Table */}
            <Card padding="none" className="border-[var(--color-border-default)] overflow-hidden">
              <div className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] px-6 py-3.5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Past Bulk Import Operations
                </h3>
              </div>

              {isLoadingJobs ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : jobsError ? (
                <div className="p-8 text-center text-red-600">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">{jobsError}</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-12 text-center text-[var(--color-text-secondary)]">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h4 className="text-base font-semibold text-[var(--color-text-primary)]">
                    No bulk import operations found
                  </h4>
                  <p className="mt-1 text-xs">
                    Start your first bulk import to onboard students, teachers, or parents in bulk.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedCategory('STUDENTS');
                      setIsModalOpen(true);
                    }}
                  >
                    Start First Import
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)]/50 text-[11px] font-semibold text-[var(--color-text-secondary)]">
                        <th className="py-3 px-4 sm:px-6">Date &amp; Time</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Filename</th>
                        <th className="py-3 px-4">Admin / Initiator</th>
                        <th className="py-3 px-4 text-center">Total / Success</th>
                        <th className="py-3 px-4 text-center">Invitations</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                      {jobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-[var(--color-surface-sunken)]/40 transition-colors"
                        >
                          <td className="py-3 px-4 sm:px-6 font-medium text-[var(--color-text-primary)]">
                            {new Date(job.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                job.category === 'STUDENTS'
                                  ? 'success'
                                  : job.category === 'TEACHERS'
                                    ? 'neutral'
                                    : 'warning'
                              }
                            >
                              {job.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-text-primary)]">
                            {job.filename}
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                            {job.actorName || 'System Admin'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-emerald-700">
                              {job.successfulRows}
                            </span>
                            <span className="text-[var(--color-text-secondary)]">
                              {' '}
                              / {job.totalRows}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-blue-700">
                              {job.invitationsSent}
                            </span>
                            <span className="text-[var(--color-text-secondary)]">
                              {' '}
                              sent ({job.invitationsCreated} total)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                job.status === 'COMPLETED'
                                  ? 'success'
                                  : job.status === 'FAILED'
                                    ? 'danger'
                                    : 'neutral'
                              }
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right">
                            {job.failedRows > 0 || job.invalidRows > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadJobErrorReport(job.id)}
                                className="text-[11px] h-7 px-2"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                <span>Error Report</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">
                                100% Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Main Bulk Import Modal */}
      <BulkImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCategory={selectedCategory}
        onSuccess={() => loadJobs()}
      />

      {/* Preview Email Invitation Modal */}
      <InvitationPreviewModal
        isOpen={isPreviewEmailOpen}
        onClose={() => setIsPreviewEmailOpen(false)}
        defaultRole={selectedCategory}
      />
    </AppShell>
  );
}
