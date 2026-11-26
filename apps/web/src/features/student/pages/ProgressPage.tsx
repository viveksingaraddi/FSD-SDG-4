import {
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  TrendingUpIcon,
} from '../../../components/icons/Icons.js';
import {
  EmptyState,
  LoadingState,
  ProgressChart,
  StatCard,
  StudentLayout,
} from '../../../components/student/index.js';
import { Badge, Card } from '../../../components/ui/index.js';
import { useStudentPreferences, useStudentProgress } from '../hooks/useStudentPortal.js';

export function ProgressPage() {
  const { data: progress, isLoading } = useStudentProgress();
  const { data: preferences } = useStudentPreferences();

  const totalCompletedTasks = (progress?.subjectProgress ?? []).reduce(
    (sum, s) => sum + s.assignmentsCompleted,
    0,
  );
  const totalAssignedTasks = (progress?.subjectProgress ?? []).reduce(
    (sum, s) => sum + s.assignmentsTotal,
    0,
  );
  const showStudyTips = preferences?.showStudyTips ?? true;

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'My Progress' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            My Progress
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            A constructive overview of your learning growth, study consistency, and next goals.
          </p>
        </div>

        {isLoading ? (
          <LoadingState label="Loading academic progress..." cards={4} />
        ) : !progress ? (
          <EmptyState
            title="Progress overview unavailable"
            description="Your academic progress summary will appear here once coursework is logged."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Overall Average"
                value={`${progress.overallScore}%`}
                hint="Steady upward trajectory"
                icon={<TrendingUpIcon className="h-5 w-5" />}
                tone="brand"
              />
              <StatCard
                label="Assignment Completion"
                value={`${progress.assignmentCompletionRate}%`}
                hint={`${totalCompletedTasks} of ${totalAssignedTasks} term tasks complete`}
                icon={<CheckCircleIcon className="h-5 w-5" />}
                tone="success"
              />
              <StatCard
                label="Weekly Study Hours"
                value={`${progress.weeklyStudyHours} hrs`}
                hint="Across 7 active days"
                icon={<ClockIcon className="h-5 w-5" />}
                tone="info"
              />
              <StatCard
                label="Study Consistency"
                value={`${progress.streakDays} days`}
                hint="Active learning streak"
                icon={<SparklesIcon className="h-5 w-5" />}
                tone="brand"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <ProgressChart
                  title="Assessment Performance Trend"
                  subtitle="Recent unit tests, mid-terms, and project reviews (%)"
                  data={progress.assessmentPerformance.map((p) => ({
                    label: p.label,
                    value: p.scorePercent,
                    secondaryLabel: p.subject,
                  }))}
                  maxValue={100}
                  unit="%"
                  barTone="indigo"
                />
              </Card>

              <Card>
                <ProgressChart
                  title="Weekly Learning Activity"
                  subtitle="Focused study minutes per day"
                  data={progress.weeklyActivity.map((d) => ({
                    label: d.day,
                    value: d.minutesStudied,
                    secondaryLabel: `${d.tasksCompleted} tasks`,
                  }))}
                  maxValue={150}
                  unit="m"
                  barTone="success"
                />
              </Card>
            </div>

            {/* Subject-wise Progress */}
            <Card>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Subject-wise Progress
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Current mastery score, target benchmark, and completed coursework per subject
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {progress.subjectProgress.map((subj) => (
                  <div
                    key={subj.courseId}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {subj.subjectName}
                      </h3>
                      <Badge variant={subj.trend === 'Improving' ? 'success' : 'brand'}>
                        {subj.trend}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">
                        Score: <strong>{subj.currentScore}%</strong> (Goal: {subj.targetScore}%)
                      </span>
                      <span className="text-[var(--color-text-muted)]">
                        {subj.assignmentsCompleted}/{subj.assignmentsTotal} tasks
                      </span>
                    </div>

                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-brand-primary)]"
                        style={{ width: `${subj.currentScore}%` }}
                      />
                    </div>

                    <p className="mt-2.5 text-xs text-[var(--color-text-secondary)]">
                      {subj.strengthNote}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Teacher Feedback & Constructive Areas of Focus */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Teacher Feedback Notes
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Highlights and encouragement from your subject teachers
                </p>

                <div className="mt-4 space-y-3">
                  {progress.teacherFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--color-brand-primary)]">
                          {fb.subjectName} · {fb.teacherName}
                        </span>
                        <Badge variant="success">{fb.highlightTag}</Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                        {fb.comment}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                        {fb.context} · {fb.date}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Areas of Growth &amp; Next Steps
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Actionable focus goals reviewed together with your teachers
                </p>

                <div className="mt-4 space-y-3">
                  {progress.areasOfGrowth.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {goal.title}
                        </h3>
                        <Badge variant="info">{goal.subjectName}</Badge>
                      </div>

                      <p className="mt-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                        Next step:{' '}
                        <span className="font-normal text-[var(--color-text-secondary)]">
                          {goal.nextStep}
                        </span>
                      </p>

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-semantic-success)]"
                            style={{ width: `${goal.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                          {goal.progressPercent}%
                        </span>
                      </div>

                      {showStudyTips && (
                        <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                          Tip: {goal.advisorNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
