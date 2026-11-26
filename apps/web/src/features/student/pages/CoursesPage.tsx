import { useMemo, useState } from 'react';
import { SearchIcon } from '../../../components/icons/Icons.js';
import {
  CourseCard,
  EmptyState,
  LoadingState,
  StudentLayout,
} from '../../../components/student/index.js';
import { Button, Card } from '../../../components/ui/index.js';
import { useStudentCourses } from '../hooks/useStudentPortal.js';
import type { Course } from '../types/student.types.js';

const CATEGORIES: Array<'ALL' | Course['category']> = [
  'ALL',
  'STEM',
  'Languages',
  'Humanities',
  'Technology',
];

export function CoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useStudentCourses();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | Course['category']>('ALL');

  const filtered = useMemo(() => {
    const list = courses ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((course) => {
      const matchesCat = category === 'ALL' || course.category === category;
      const matchesQuery =
        !term ||
        course.subjectName.toLowerCase().includes(term) ||
        course.code.toLowerCase().includes(term) ||
        course.teacher.name.toLowerCase().includes(term) ||
        course.currentUnit.toLowerCase().includes(term);
      return matchesCat && matchesQuery;
    });
  }, [courses, search, category]);

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'My Courses' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              My Courses
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Access your enrolled Grade 8 subjects, track lesson completion, and open study units.
            </p>
          </div>
          {courses && (
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              Showing {filtered.length} of {courses.length} enrolled courses
            </p>
          )}
        </div>

        {/* Search & Category Filters */}
        <Card padding="sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-sm">
              <label htmlFor="course-search" className="sr-only">
                Search courses
              </label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                id="course-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject, code, or teacher..."
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:bg-white focus:outline-none"
              />
            </div>

            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter courses by department"
            >
              {CATEGORIES.map((cat) => {
                const active = cat === category;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    aria-pressed={active}
                    className={`min-h-[36px] rounded-[var(--radius-pill)] border px-3 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
                        : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Subjects' : cat}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState label="Loading enrolled courses..." cards={6} />
        ) : isError ? (
          <EmptyState
            title="Could not load courses"
            description="Something went wrong while fetching your course list."
            action={<Button onClick={() => void refetch()}>Retry</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching courses"
            description="Try adjusting your search keyword or switching back to All Subjects."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategory('ALL');
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
