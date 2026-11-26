import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchTeacherClasses } from './teacherApi';

export function TeacherClassesPage() {
  const navigate = useNavigate();
  const classesQuery = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: ({ signal }) => fetchTeacherClasses(signal),
  });

  return (
    <AppShell
      title="My Classes"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'My Classes' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2" className="text-xl font-bold">
              Assigned Classes &amp; Cohorts
            </Heading>
            <Text variant="small" className="text-[var(--color-text-muted)] mt-1">
              Course sections, room assignments, and active student rosters assigned to your
              teaching load.
            </Text>
          </div>
          <Button
            variant="primary"
            leftIcon={<Calendar className="h-4 w-4" />}
            onClick={() => navigate('/teacher/attendance')}
          >
            Open Attendance Grid
          </Button>
        </div>

        {classesQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : classesQuery.isError ? (
          <ErrorState
            title="Unable to load classes"
            description="Failed to fetch your assigned teaching sections."
            onRetry={() => void classesQuery.refetch()}
          />
        ) : (classesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No class allocations assigned"
            description="Your school administrator has not assigned any active classroom sections to your profile yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classesQuery.data?.map((cls) => (
              <Card
                key={cls.courseOfferingId}
                padding="lg"
                className="flex flex-col justify-between hover:border-[var(--color-brand-primary)]/50 transition-all rounded-2xl shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-[var(--color-surface-sunken)] px-2.5 py-1 text-xs font-bold text-[var(--color-brand-primary)] border border-[var(--color-border-default)]">
                      {cls.subjectCode}
                    </span>
                    <Badge variant={cls.isPrimaryTeacher ? 'success' : 'neutral'}>
                      {cls.isPrimaryTeacher ? 'Primary Faculty' : 'Assistant'}
                    </Badge>
                  </div>

                  <Heading level={3} size="h3" className="mt-3 font-bold text-base">
                    {cls.subjectName}
                  </Heading>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-0.5">
                    {cls.className} &ndash; Section {cls.sectionName}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[var(--color-border-default)] space-y-2 text-xs text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span>{cls.roomNumber ? `Room ${cls.roomNumber}` : 'Room unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span>
                        {cls.studentCount} Students Enrolled{' '}
                        {cls.capacity ? `(${cls.capacity} capacity)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span>Academic Year: {cls.academicYearName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--color-border-default)] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/teacher/students')}
                  >
                    View Students
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/teacher/attendance')}
                  >
                    Take Attendance
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default TeacherClassesPage;
