import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Input,
  Select,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchChildAssignments, fetchChildGrades, fetchLinkedChildren } from './parentApi';

type CalendarCategory = 'ALL' | 'EXAMINATION' | 'ASSIGNMENT_DUE' | 'HOLIDAY' | 'SCHOOL_EVENT' | 'PTM';

interface CalendarItem {
  id: string;
  date: string;
  title: string;
  description: string;
  category: Exclude<CalendarCategory, 'ALL'>;
}

const CATEGORY_BADGE: Record<
  Exclude<CalendarCategory, 'ALL'>,
  { label: string; variant: 'brand' | 'warning' | 'success' | 'neutral' }
> = {
  EXAMINATION: { label: 'Examination', variant: 'brand' },
  ASSIGNMENT_DUE: { label: 'Assignment Due', variant: 'warning' },
  HOLIDAY: { label: 'Holiday', variant: 'success' },
  SCHOOL_EVENT: { label: 'School Event', variant: 'neutral' },
  PTM: { label: 'Parent–Teacher Meeting', variant: 'brand' },
};

export function ParentCalendarPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [categoryFilter, setCategoryFilter] = useState<CalendarCategory>('ALL');

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

  const gradesQuery = useQuery({
    queryKey: ['parent', 'grades', activeStudentId],
    queryFn: ({ signal }) => fetchChildGrades(activeStudentId, signal),
    enabled: Boolean(activeStudentId),
  });

  const academicItems: CalendarItem[] = [];
  for (const a of assignmentsQuery.data?.assignments ?? []) {
    academicItems.push({
      id: `assign-${a.assignmentId}`,
      date: a.dueDate,
      title: `${a.title} (${a.subjectName})`,
      description: `Assignment due · Teacher: ${a.teacherName}`,
      category: 'ASSIGNMENT_DUE',
    });
  }
  for (const subj of gradesQuery.data?.subjects ?? []) {
    for (const exam of subj.assessments) {
      academicItems.push({
        id: `exam-${exam.assessmentId}`,
        date: exam.assessmentDate,
        title: `${exam.title} (${subj.subjectName})`,
        description: `Assessment · Weight: ${exam.weightPercentage}%`,
        category: 'EXAMINATION',
      });
    }
  }

  const monthItems = academicItems
    .filter((item) => item.date.startsWith(selectedMonth))
    .filter((item) => categoryFilter === 'ALL' || item.category === categoryFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth =
    yearNum && monthNum ? new Date(yearNum, monthNum, 0).getDate() : 30;
  const firstDayOfWeek =
    yearNum && monthNum ? new Date(yearNum, monthNum - 1, 1).getDay() : 0;

  return (
    <AppShell
      title="Calendar & Events"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Calendar' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              School Calendar &amp; Academic Dates
            </Heading>
            <Text variant="small" className="mt-1">
              View upcoming examination dates, assignment deadlines, and school calendar events.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <Input
              type="month"
              aria-label="Select month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <Select
              aria-label="Filter by event category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CalendarCategory)}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'EXAMINATION', label: 'Examinations' },
                { value: 'ASSIGNMENT_DUE', label: 'Assignment Deadlines' },
                { value: 'HOLIDAY', label: 'Holidays' },
                { value: 'SCHOOL_EVENT', label: 'School Events' },
                { value: 'PTM', label: 'Parent–Teacher Meetings' },
              ]}
            />
          </div>
        </div>

        <Alert variant="info" title="School Events Backend Status">
          Assignment due dates and examination dates are loaded from live academic records.
          School-wide holidays, general events, and parent–teacher meeting schedules require a
          dedicated backend calendar event model (not yet provisioned).
        </Alert>

        {(childrenQuery.isLoading || assignmentsQuery.isLoading || gradesQuery.isLoading) && (
          <Skeleton className="h-64 w-full" />
        )}

        {(childrenQuery.isError || assignmentsQuery.isError || gradesQuery.isError) && (
          <ErrorState
            title="Unable to load calendar data"
            description="Please try again later."
            onRetry={() => {
              void assignmentsQuery.refetch();
              void gradesQuery.refetch();
            }}
          />
        )}

        {!childrenQuery.isLoading && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {activeStudentId && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Monthly Grid */}
            <Card className="lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
                <CalendarIcon
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
                <Heading level={3} size="h3">
                  {selectedMonth}
                </Heading>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--color-text-muted)]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="min-h-[64px] rounded-[var(--radius-sm)]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                  const dayEvents = monthItems.filter((item) => item.date === dateStr);
                  return (
                    <div
                      key={dateStr}
                      className="min-h-[64px] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-1.5 text-xs"
                    >
                      <span className="font-semibold text-[var(--color-text-primary)]">{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            title={ev.title}
                            className="truncate rounded bg-[var(--color-brand-primary-subtle)] px-1 py-0.5 text-[10px] font-medium text-[var(--color-brand-primary)]"
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="block text-[10px] text-[var(--color-text-muted)]">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Upcoming Events List */}
            <Card>
              <Heading level={3} size="h3">
                Events in {selectedMonth}
              </Heading>
              {monthItems.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No events for this filter"
                    description="No scheduled examinations or assignment deadlines match your current filter."
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {monthItems.map((item) => {
                    const badge = CATEGORY_BADGE[item.category];
                    return (
                      <li
                        key={item.id}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                          {item.description}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ParentCalendarPage;
