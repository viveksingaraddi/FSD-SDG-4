import { ClipboardList } from 'lucide-react';
import { Badge, Card, EmptyState, Heading, Text } from '@/components/ui';
import type { DemoSubmissionStatus, DemoUpcomingAssignment } from '@/data/parentDemoData';

export interface UpcomingAssignmentsCardProps {
  assignments: DemoUpcomingAssignment[];
}

const STATUS_BADGE_MAP: Record<
  DemoSubmissionStatus,
  { label: string; variant: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  SUBMITTED: { label: 'Submitted', variant: 'brand' },
  LATE: { label: 'Late', variant: 'danger' },
  GRADED: { label: 'Graded', variant: 'success' },
};

export function UpcomingAssignmentsCard({ assignments }: UpcomingAssignmentsCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
          <Heading level={3} size="h3">
            Upcoming Assignments
          </Heading>
        </div>
        <Badge variant="neutral">{assignments.length} items</Badge>
      </div>

      <Text variant="small" className="mt-1">
        Recent and upcoming coursework with due dates and submission status.
      </Text>

      {assignments.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No upcoming assignments"
            description="All coursework is up to date."
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
          {assignments.map((assignment) => {
            const statusInfo = STATUS_BADGE_MAP[assignment.status];
            return (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {assignment.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {assignment.subjectName} · Due {assignment.dueDate}
                  </p>
                </div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
