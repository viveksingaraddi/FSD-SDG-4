import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Heading, Text } from '@/components/ui';
import type { DemoSubjectGrade } from '@/data/parentDemoData';

export interface AcademicOverviewCardProps {
  grades: DemoSubjectGrade[];
}

export function AcademicOverviewCard({ grades }: AcademicOverviewCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
            <Heading level={3} size="h3">
              Academic Overview
            </Heading>
          </div>
          <Badge variant="neutral">{grades.length} subjects</Badge>
        </div>

        <Text variant="small" className="mt-1">
          Published grades and subject progress indicators.
        </Text>

        {grades.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No published grades yet"
              description="Grades will appear here once teachers publish term assessments."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {grades.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {item.subjectName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.subjectCode} · {item.teacherName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {item.latestScore}/{item.maxScore}
                    </span>
                    <Badge variant="brand">{item.gradeLetter}</Badge>
                  </div>
                </div>
                <div
                  className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
                  role="progressbar"
                  aria-valuenow={item.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.subjectName} progress ${item.progressPercent}%`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--color-brand-primary)]"
                    style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 border-t border-[var(--color-border-default)] pt-3">
        <Link to="/parent/progress">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View Full Progress Report
          </Button>
        </Link>
      </div>
    </Card>
  );
}
