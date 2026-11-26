import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, HeartHandshake } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import {
  fetchChildSupportPlans,
  fetchLinkedChildren,
  updateChildSupportAction,
} from './parentApi';

export function ParentSupportPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  const plansQuery = useQuery({
    queryKey: ['parent', 'support-plans', activeStudentId],
    queryFn: ({ signal }) => fetchChildSupportPlans(activeStudentId, signal),
    enabled: Boolean(activeStudentId),
  });

  const actionMutation = useMutation({
    mutationFn: (vars: { actionId: string; status: 'PENDING' | 'COMPLETED' }) =>
      updateChildSupportAction(activeStudentId, vars.actionId, vars.status),
    onSuccess: () => {
      showToast({ variant: 'success', title: 'Support action updated' });
      void queryClient.invalidateQueries({
        queryKey: ['parent', 'support-plans', activeStudentId],
      });
    },
    onError: (err) => {
      showToast({
        variant: 'danger',
        title: 'Unable to update support action',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const plans = plansQuery.data ?? [];

  return (
    <AppShell
      title="Support Plans"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Support Plans' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Active Support Plans
            </Heading>
            <Text variant="small" className="mt-1">
              Collaborate with teachers on approved learning goals and home-support action items.
            </Text>
          </div>
          {children.length > 0 && (
            <Select
              aria-label="Select child"
              value={activeStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={children.map((c) => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName} (${c.className})`,
              }))}
            />
          )}
        </div>

        {(childrenQuery.isLoading || plansQuery.isLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {(childrenQuery.isError || plansQuery.isError) && (
          <ErrorState
            title="Unable to load support plans"
            description="Please try again later."
            onRetry={() => void plansQuery.refetch()}
          />
        )}

        {!childrenQuery.isLoading && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {!plansQuery.isLoading && !plansQuery.isError && activeStudentId && plans.length === 0 && (
          <EmptyState
            title="No active support plans"
            description="There are currently no active approved support plans for this student."
          />
        )}

        {plans.length > 0 && (
          <div className="space-y-6">
            {plans.map((plan) => {
              const completedCount = plan.actionItems.filter(
                (i) => i.status === 'COMPLETED',
              ).length;
              const totalCount = plan.actionItems.length;
              const progressPct =
                totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <Card key={plan.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-default)] pb-3">
                    <div className="flex items-start gap-2.5">
                      <HeartHandshake
                        className="mt-0.5 h-5 w-5 text-[var(--color-brand-primary)]"
                        aria-hidden="true"
                      />
                      <div>
                        <Heading level={3} size="h3">
                          {plan.targetGoal}
                        </Heading>
                        <Text variant="small" className="mt-1">
                          Lead Teacher: {plan.leadTeacherName} · Review Date: {plan.reviewDate}
                        </Text>
                      </div>
                    </div>
                    <Badge variant="brand">{plan.status}</Badge>
                  </div>

                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    {plan.problemSummary}
                  </p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Action Progress</span>
                      <span>
                        {completedCount}/{totalCount} completed ({progressPct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-brand-primary)]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {plan.actionItems.length > 0 && (
                    <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
                      {plan.actionItems.map((item) => {
                        const isDone = item.status === 'COMPLETED';
                        return (
                          <li
                            key={item.id}
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
                                  {item.description}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                  Due: {item.dueDate}
                                  {item.isHomeAction ? ' · Home Action' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={isDone ? 'success' : 'neutral'}>{item.status}</Badge>
                              {(item.status === 'PENDING' || item.status === 'COMPLETED') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionMutation.isPending}
                                  onClick={() =>
                                    actionMutation.mutate({
                                      actionId: item.id,
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
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ParentSupportPage;
