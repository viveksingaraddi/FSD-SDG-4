import { useMemo, useState } from 'react';
import { ClockIcon, MapPinIcon, SparklesIcon } from '../../../components/icons/Icons.js';
import { EmptyState, LoadingState, StudentLayout } from '../../../components/student/index.js';
import { Badge, Card, Tabs } from '../../../components/ui/index.js';
import { useStudentAssessments } from '../hooks/useStudentPortal.js';
import type { AssessmentStatus } from '../types/student.types.js';

export function AssessmentsPage() {
  const { data: assessments, isLoading } = useStudentAssessments();
  const [tab, setTab] = useState<'ALL' | AssessmentStatus>('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  const subjects = useMemo(() => {
    const unique = new Set((assessments ?? []).map((a) => a.subjectName));
    return ['ALL', ...Array.from(unique)];
  }, [assessments]);

  const upcomingCount = (assessments ?? []).filter((a) => a.status === 'UPCOMING').length;
  const completedCount = (assessments ?? []).filter((a) => a.status === 'COMPLETED').length;

  const filtered = useMemo(() => {
    return (assessments ?? []).filter((item) => {
      const matchTab = tab === 'ALL' || item.status === tab;
      const matchSub = subjectFilter === 'ALL' || item.subjectName === subjectFilter;
      return matchTab && matchSub;
    });
  }, [assessments, tab, subjectFilter]);

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Assessments' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Assessments
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              View upcoming examination schedules, syllabus topics, and completed test feedback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="assessment-subject-filter"
              className="text-xs font-medium text-[var(--color-text-muted)]"
            >
              Subject:
            </label>
            <select
              id="assessment-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj === 'ALL' ? 'All Subjects' : subj}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Tabs
          ariaLabel="Filter assessments"
          activeTab={tab}
          onChange={(value) => setTab(value as 'ALL' | AssessmentStatus)}
          items={[
            { id: 'ALL', label: 'All Assessments', badge: (assessments ?? []).length },
            { id: 'UPCOMING', label: 'Upcoming Schedule', badge: upcomingCount },
            { id: 'COMPLETED', label: 'Completed History', badge: completedCount },
          ]}
        />

        {isLoading ? (
          <LoadingState variant="list" label="Loading assessments..." cards={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No assessments found"
            description="No scheduled or completed assessments match the selected subject."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{item.subjectName}</Badge>
                      <Badge variant="neutral">{item.type}</Badge>
                    </div>
                    <Badge variant={item.status === 'UPCOMING' ? 'warning' : 'success'}>
                      {item.status === 'UPCOMING' ? 'Upcoming' : 'Completed'}
                    </Badge>
                  </div>

                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </h2>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      {item.date} · {item.timeWindow} ({item.durationMinutes} min)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      {item.roomOrMode}
                    </span>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">
                      Syllabus Topics:
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.syllabusTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--color-border-subtle)] pt-3">
                  {item.status === 'UPCOMING' ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-muted)]">
                        Total Marks:{' '}
                        <strong className="text-[var(--color-text-primary)]">
                          {item.totalMarks}
                        </strong>
                      </span>
                      <span className="font-medium text-[var(--color-brand-primary)]">
                        Review syllabus topics ahead of test day
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-semantic-success)]">
                          Score: {item.scoreObtained}/{item.totalMarks} ({item.percentage}%)
                        </span>
                        <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
                          <SparklesIcon className="h-3.5 w-3.5 text-[var(--color-semantic-success)]" />
                          Teacher Feedback
                        </span>
                      </div>
                      {item.teacherFeedback && (
                        <p className="rounded-[var(--radius-md)] bg-[var(--color-surface-canvas)] p-2.5 text-xs text-[var(--color-text-secondary)]">
                          {item.teacherFeedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
