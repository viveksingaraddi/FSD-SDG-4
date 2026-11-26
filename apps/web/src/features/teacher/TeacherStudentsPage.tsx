import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, ErrorState, Heading, SearchInput, Text } from '@/components/ui';
import { fetchTeacherStudents } from './teacherApi';

export function TeacherStudentsPage() {
  const [search, setSearch] = useState('');

  const studentsQuery = useQuery({
    queryKey: ['teacher', 'students', search],
    queryFn: ({ signal }) => fetchTeacherStudents(search, signal),
  });

  return (
    <AppShell
      title="My Students"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'My Students' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2" className="text-xl font-bold">
              Student Directory &amp; Roster
            </Heading>
            <Text variant="small" className="text-[var(--color-text-muted)] mt-1">
              Learners enrolled across all your assigned classroom cohorts.
            </Text>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              label="Search students"
              placeholder="Search by student name or ID..."
            />
          </div>
        </div>

        {studentsQuery.isError ? (
          <ErrorState
            title="Unable to load students"
            description="Failed to retrieve enrolled learners from the school database."
            onRetry={() => void studentsQuery.refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="Assigned students list"
            loading={studentsQuery.isLoading}
            rows={studentsQuery.data ?? []}
            getRowKey={(r) => r.id}
            emptyTitle="No students found"
            emptyDescription="No learners currently match your search criteria or class allocations."
            columns={[
              {
                key: 'name',
                header: 'Student',
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border-default)] font-semibold text-xs text-[var(--color-text-primary)]">
                      {r.firstName[0]}
                      {r.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{r.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'studentIdNumber',
                header: 'Student ID',
                render: (r) => (
                  <span className="font-mono text-xs font-medium text-[var(--color-text-secondary)]">
                    {r.studentIdNumber}
                  </span>
                ),
              },
              {
                key: 'currentSection',
                header: 'Class / Section',
                render: (r) => <Badge variant="neutral">{r.currentSection}</Badge>,
              },
              {
                key: 'attendanceRate',
                header: 'Attendance',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        r.attendanceRate >= 90
                          ? 'success'
                          : r.attendanceRate >= 75
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {r.attendanceRate}%
                    </Badge>
                  </div>
                ),
              },
              {
                key: 'parent',
                header: 'Guardian Contact',
                render: (r) =>
                  r.parentEmail ? (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                      <Mail className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span>{r.parentEmail}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">Not linked</span>
                  ),
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}

export default TeacherStudentsPage;
