import { Link } from 'react-router-dom';
import type { Course } from '../../features/student/types/student.types.js';
import { BookOpenIcon, ChevronRightIcon, UserIcon } from '../icons/Icons.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

export interface CourseCardProps {
  course: Course;
}

const ACCENT_BAR: Record<Course['accentColor'], string> = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-600',
  cyan: 'bg-cyan-600',
  slate: 'bg-slate-600',
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card
      interactive
      padding="none"
      className="flex h-full flex-col overflow-hidden"
      role="article"
      aria-label={`${course.subjectName} course`}
    >
      <div className={`h-1.5 w-full ${ACCENT_BAR[course.accentColor]}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-mono text-xs font-medium text-[var(--color-text-muted)]">
              {course.code}
            </span>
            <h2 className="mt-0.5 text-base font-semibold text-[var(--color-text-primary)]">
              {course.subjectName}
            </h2>
          </div>
          <Badge variant="neutral">{course.category}</Badge>
        </div>

        <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
          {course.currentUnit}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <UserIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{course.teacher.name}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--color-text-secondary)]">
              {course.completedLessons} of {course.totalLessons} lessons
            </span>
            <span className="font-semibold text-[var(--color-brand-primary)]">
              {course.progressPercent}%
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
            role="progressbar"
            aria-valuenow={course.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${course.subjectName} completion`}
          >
            <div
              className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all"
              style={{ width: `${course.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Link
            to={`/student/courses/${course.id}`}
            className="inline-flex min-h-[38px] items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)]"
          >
            <BookOpenIcon className="h-4 w-4" />
            <span>Open Course</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {course.credits} credits
          </span>
        </div>
      </div>
    </Card>
  );
}
