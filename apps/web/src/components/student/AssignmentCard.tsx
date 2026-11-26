import { Link } from 'react-router-dom';
import type { Assignment, AssignmentStatus } from '../../features/student/types/student.types.js';
import { ChevronRightIcon, ClockIcon } from '../icons/Icons.js';
import { Badge, type BadgeVariant } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

export interface AssignmentCardProps {
  assignment: Assignment;
}

export const ASSIGNMENT_STATUS_META: Record<
  AssignmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  NOT_STARTED: { label: 'Not Started', variant: 'neutral' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  REVIEWED: { label: 'Reviewed', variant: 'success' },
};

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const statusMeta = ASSIGNMENT_STATUS_META[assignment.status];

  return (
    <Card interactive className="flex flex-col justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--color-brand-primary)]">
            {assignment.subjectName}
          </span>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        <h2 className="mt-1.5 text-base font-semibold text-[var(--color-text-primary)]">
          <Link
            to={`/student/assignments/${assignment.id}`}
            className="hover:text-[var(--color-brand-primary)] hover:underline"
          >
            {assignment.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{assignment.summary}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-[var(--color-text-muted)]">
          <span>{assignment.teacherName}</span>
          <span className="inline-flex items-center gap-1 font-medium text-[var(--color-text-secondary)]">
            <ClockIcon className="h-3.5 w-3.5" />
            {assignment.dueLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {assignment.status === 'REVIEWED' && assignment.marksObtained !== undefined && (
            <span className="font-semibold text-[var(--color-semantic-success)]">
              {assignment.marksObtained}/{assignment.maxMarks} marks
            </span>
          )}
          <Link
            to={`/student/assignments/${assignment.id}`}
            className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            <span>
              {assignment.status === 'NOT_STARTED' || assignment.status === 'IN_PROGRESS'
                ? 'View & Submit'
                : 'View Details'}
            </span>
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
