import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Select,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchChildGrades, fetchLinkedChildren } from './parentApi';

export function ParentProgressPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  const gradesQuery = useQuery({
    queryKey: ['parent', 'grades', activeStudentId],
    queryFn: ({ signal }) => fetchChildGrades(activeStudentId, signal),
    enabled: Boolean(activeStudentId),
  });

  const report = gradesQuery.data;
  const subjects = report?.subjects ?? [];
  const filteredSubjects =
    subjectFilter === 'ALL'
      ? subjects
      : subjects.filter((s) => s.courseOfferingId === subjectFilter);

  return (
    <AppShell
      title="Academic Progress"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Academic Progress' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Academic Progress &amp; Published Grades
            </Heading>
            <Text variant="small" className="mt-1">
              Subject-wise published assessments, coursework completion, and teacher feedback.
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
            {subjects.length > 0 && (
              <Select
                aria-label="Filter by subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Subjects' },
                  ...subjects.map((s) => ({
                    value: s.courseOfferingId,
                    label: s.subjectName,
                  })),
                ]}
              />
            )}
          </div>
        </div>

        {(childrenQuery.isLoading || gradesQuery.isLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {(childrenQuery.isError || gradesQuery.isError) && (
          <ErrorState
            title="Unable to load academic progress"
            description="Please try again later."
            onRetry={() => void gradesQuery.refetch()}
          />
        )}

        {!childrenQuery.isLoading && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {report && filteredSubjects.length === 0 && (
          <EmptyState
            title="No published subjects or grades yet"
            description="Published assessments and assignments will appear here once teachers release them."
          />
        )}

        {report && filteredSubjects.length > 0 && (
          <div className="space-y-6">
            {filteredSubjects.map((subject) => (
              <Card key={subject.courseOfferingId}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      aria-hidden="true"
                    />
                    <div>
                      <Heading level={3} size="h3">
                        {subject.subjectName}
                      </Heading>
                      <Text variant="small">
                        {subject.subjectCode} · Teacher: {subject.teacherName}
                      </Text>
                    </div>
                  </div>
                  <Badge variant="neutral">
                    {subject.assessments.length} assessments · {subject.assignments.length}{' '}
                    assignments
                  </Badge>
                </div>

                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Published Assessments
                    </p>
                    {subject.assessments.length === 0 ? (
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                        No published assessment results yet.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2.5">
                        {subject.assessments.map((a) => {
                          const pct =
                            a.maxMarks > 0 ? Math.round((a.score / a.maxMarks) * 100) : 0;
                          return (
                            <li
                              key={a.assessmentId}
                              className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{a.title}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {a.score}/{a.maxMarks}
                                  </span>
                                  {a.gradeLetter && <Badge variant="brand">{a.gradeLetter}</Badge>}
                                </div>
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                                <div
                                  className="h-full rounded-full bg-[var(--color-brand-primary)]"
                                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                />
                              </div>
                              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                                Date: {a.assessmentDate} · Weight: {a.weightPercentage}%
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Published Assignments
                    </p>
                    {subject.assignments.length === 0 ? (
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                        No published assignments yet.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2.5">
                        {subject.assignments.map((assign) => (
                          <li
                            key={assign.assignmentId}
                            className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{assign.title}</span>
                              <Badge
                                variant={assign.status === 'GRADED' ? 'success' : 'neutral'}
                              >
                                {assign.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              Due: {assign.dueDate}
                              {assign.score !== null
                                ? ` · Score: ${assign.score}/${assign.maxPoints}`
                                : ''}
                            </p>
                            {assign.feedback && (
                              <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
                                Feedback: {assign.feedback}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ParentProgressPage;
