import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ClipboardList, Eye, HeartHandshake } from 'lucide-react';
import type { ParentAssignmentItemDto } from '@fsd-sdg4/contracts';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Modal,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import {
  fetchChildAssignments,
  fetchChildSupportPlans,
  fetchLinkedChildren,
  updateChildSupportAction,
} from './parentApi';

const STATUS_BADGE: Record<
  ParentAssignmentItemDto['status'],
  { label: string; variant: 'warning' | 'danger' | 'brand' | 'success' }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  SUBMITTED: { label: 'Submitted', variant: 'brand' },
  LATE: { label: 'Late', variant: 'danger' },
  GRADED: { label: 'Graded', variant: 'success' },
};

export function ParentAssignmentsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailItem, setDetailItem] = useState<ParentAssignmentItemDto | null>(null);

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  const assignmentsQuery = useQuery({
    queryKey: ['parent', 'assignments', activeStudentId],
    queryFn: ({ signal }) => fetchChildAssignments(activeStudentId, signal),
    enabled: Boolean(activeStudentId),
  });

  const supportPlansQuery = useQuery({
    queryKey: ['parent', 'support-plans', activeStudentId],
    queryFn: ({ signal }) => fetchChildSupportPlans(activeStudentId, signal),
    enabled: Boolean(activeStudentId),
  });

  const actionMutation = useMutation({
    mutationFn: (vars: { actionId: string; status: 'PENDING' | 'COMPLETED' }) =>
      updateChildSupportAction(activeStudentId, vars.actionId, vars.status),
    onSuccess: () => {
      showToast({ variant: 'success', title: 'Home activity updated' });
      void queryClient.invalidateQueries({
        queryKey: ['parent', 'support-plans', activeStudentId],
      });
    },
    onError: (err) => {
      showToast({
        variant: 'danger',
        title: 'Unable to update activity',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const uniqueSubjects = Array.from(new Set(assignments.map((a) => a.subjectName))).sort();

  const filteredAssignments = assignments.filter((a) => {
    if (subjectFilter !== 'ALL' && a.subjectName !== subjectFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const homeActivities = (supportPlansQuery.data ?? []).flatMap((plan) =>
    plan.actionItems
      .filter((item) => item.isHomeAction)
      .map((item) => ({ ...item, goal: plan.targetGoal, teacher: plan.leadTeacherName })),
  );

  return (
    <AppShell
      title="Assignments & Home Activities"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Assignments' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Assignments &amp; Parent-Assisted Activities
            </Heading>
            <Text variant="small" className="mt-1">
              Track your child&apos;s teacher-assigned coursework and complete parent-assisted home
              support activities.
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {children.length > 0 && (
              <Select
                aria-label="Select child"
                value={activeStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setSubjectFilter('ALL');
                }}
                options={children.map((c) => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName} (${c.className})`,
                }))}
              />
            )}
            <Select
              aria-label="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Subjects' },
                ...uniqueSubjects.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'OVERDUE', label: 'Overdue' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'LATE', label: 'Late' },
                { value: 'GRADED', label: 'Graded' },
              ]}
            />
          </div>
        </div>

        <Alert variant="info" title="Academic Integrity Notice">
          Parents can view assignment instructions and deadlines, and mark parent-assisted home
          activities as completed. Academic submissions must be completed by the student in their
          Student Portal.
        </Alert>

        {(childrenQuery.isLoading || assignmentsQuery.isLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {(childrenQuery.isError || assignmentsQuery.isError) && (
          <ErrorState
            title="Unable to load assignments"
            description="Please verify your connection and try again."
            onRetry={() => void assignmentsQuery.refetch()}
          />
        )}

        {!childrenQuery.isLoading && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {!assignmentsQuery.isLoading && !assignmentsQuery.isError && activeStudentId && (
          <div className="space-y-6">
            {/* Teacher Assignments */}
            <Card>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardList
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Teacher Assignments
                  </Heading>
                </div>
                <Badge variant="neutral">{filteredAssignments.length} assignments</Badge>
              </div>

              {filteredAssignments.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No matching assignments"
                    description="No published teacher assignments match the selected filters."
                  />
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
                  {filteredAssignments.map((item) => {
                    const badge = STATUS_BADGE[item.status];
                    return (
                      <li
                        key={item.assignmentId}
                        className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {item.title}
                            </p>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {item.subjectName} ({item.subjectCode}) · Teacher: {item.teacherName} ·
                            Assigned: {item.assignedDate} · Due: <strong>{item.dueDate}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.score !== null && (
                            <Badge variant="success">
                              {item.score}/{item.maxPoints} pts
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            onClick={() => setDetailItem(item)}
                          >
                            Details
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Parent-Assisted Home Activities */}
            <Card>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HeartHandshake
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Parent-Assisted Home Activities
                  </Heading>
                </div>
                <Badge variant="brand">{homeActivities.length} activities</Badge>
              </div>
              <Text variant="small" className="mt-1">
                Guided reading, practice, and home support tasks assigned to you in active support
                plans.
              </Text>

              {homeActivities.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No parent-assisted home activities"
                    description="When a teacher assigns a home-support action item in an active support plan, it will appear here."
                  />
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
                  {homeActivities.map((act) => {
                    const isDone = act.status === 'COMPLETED';
                    return (
                      <li
                        key={act.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-start gap-2.5">
                          {isDone ? (
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="mt-0.5 h-4 w-4 text-[var(--color-text-muted)]"
                              aria-hidden="true"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {act.description}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              Goal: {act.goal} · Teacher: {act.teacher} · Due: {act.dueDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isDone ? 'success' : 'neutral'}>{act.status}</Badge>
                          {(act.status === 'PENDING' || act.status === 'COMPLETED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionMutation.isPending}
                              onClick={() =>
                                actionMutation.mutate({
                                  actionId: act.id,
                                  status: isDone ? 'PENDING' : 'COMPLETED',
                                })
                              }
                            >
                              {isDone ? 'Mark Pending' : 'Mark Completed'}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* Assignment Detail Modal */}
        <Modal
          open={detailItem !== null}
          onClose={() => setDetailItem(null)}
          title={detailItem?.title ?? 'Assignment Details'}
        >
          {detailItem && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_BADGE[detailItem.status].variant}>
                  {STATUS_BADGE[detailItem.status].label}
                </Badge>
                <Badge variant="neutral">
                  {detailItem.subjectName} ({detailItem.subjectCode})
                </Badge>
                <Badge variant="neutral">Max Points: {detailItem.maxPoints}</Badge>
              </div>

              <div className="text-xs text-[var(--color-text-muted)]">
                <p>Teacher: {detailItem.teacherName}</p>
                <p>
                  Assigned: {detailItem.assignedDate} · Due: {detailItem.dueDate}
                </p>
                {detailItem.submittedAt && (
                  <p>Submitted at: {new Date(detailItem.submittedAt).toLocaleString()}</p>
                )}
              </div>

              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Teacher Instructions
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">
                  {detailItem.instructions}
                </p>
              </div>

              {detailItem.feedback && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Teacher Feedback
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {detailItem.feedback}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setDetailItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}

export default ParentAssignmentsPage;
