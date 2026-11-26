import { useMemo, useState } from 'react';
import { SearchIcon } from '../../../components/icons/Icons.js';
import {
  AssignmentCard,
  EmptyState,
  LoadingState,
  StudentLayout,
} from '../../../components/student/index.js';
import { Button, Card, Tabs } from '../../../components/ui/index.js';
import { useStudentAssignments } from '../hooks/useStudentPortal.js';
import type { AssignmentStatus } from '../types/student.types.js';

type StatusFilter = 'ALL' | AssignmentStatus;

export function AssignmentsPage() {
  const { data: assignments, isLoading, isError, refetch } = useStudentAssignments();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const subjects = useMemo(() => {
    const unique = new Set((assignments ?? []).map((a) => a.subjectName));
    return ['ALL', ...Array.from(unique)];
  }, [assignments]);

  const counts = useMemo(() => {
    const list = assignments ?? [];
    return {
      ALL: list.length,
      NOT_STARTED: list.filter((a) => a.status === 'NOT_STARTED').length,
      IN_PROGRESS: list.filter((a) => a.status === 'IN_PROGRESS').length,
      SUBMITTED: list.filter((a) => a.status === 'SUBMITTED').length,
      REVIEWED: list.filter((a) => a.status === 'REVIEWED').length,
    };
  }, [assignments]);

  const filtered = useMemo(() => {
    const list = assignments ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSubject = subjectFilter === 'ALL' || item.subjectName === subjectFilter;
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.subjectName.toLowerCase().includes(term) ||
        item.teacherName.toLowerCase().includes(term);
      return matchesStatus && matchesSubject && matchesSearch;
    });
  }, [assignments, statusFilter, subjectFilter, search]);

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Assignments' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Track upcoming homework, upload coursework files, and read reviewed teacher feedback.
          </p>
        </div>

        <Tabs
          ariaLabel="Filter assignments by status"
          activeTab={statusFilter}
          onChange={(tab) => setStatusFilter(tab as StatusFilter)}
          items={[
            { id: 'ALL', label: 'All', badge: counts.ALL },
            { id: 'NOT_STARTED', label: 'Not Started', badge: counts.NOT_STARTED },
            { id: 'IN_PROGRESS', label: 'In Progress', badge: counts.IN_PROGRESS },
            { id: 'SUBMITTED', label: 'Submitted', badge: counts.SUBMITTED },
            { id: 'REVIEWED', label: 'Reviewed', badge: counts.REVIEWED },
          ]}
        />

        <Card padding="sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <label htmlFor="assignment-search" className="sr-only">
                Search assignments
              </label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                id="assignment-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignment title or teacher..."
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="assignment-subject-filter"
                className="text-xs font-medium text-[var(--color-text-muted)]"
              >
                Subject:
              </label>
              <select
                id="assignment-subject-filter"
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
        </Card>

        {isLoading ? (
          <LoadingState variant="list" label="Loading assignments..." cards={4} />
        ) : isError ? (
          <EmptyState
            title="Could not load assignments"
            description="Please retry to fetch your coursework list."
            action={<Button onClick={() => void refetch()}>Retry</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No assignments match your filter"
            description="Switch tabs or clear your search filter to see all coursework."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSubjectFilter('ALL');
                  setSearch('');
                }}
              >
                Show all assignments
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
