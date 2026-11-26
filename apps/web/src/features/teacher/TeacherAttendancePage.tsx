import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Heading,
  Input,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { fetchAttendanceRoster, fetchTeacherClasses, submitAttendanceRoster } from './teacherApi';
import type { MarkAttendanceRecordInput } from '@fsd-sdg4/validation';

export function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [localRecords, setLocalRecords] = useState<Record<string, MarkAttendanceRecordInput>>({});

  // 1. Fetch available classes
  const classesQuery = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: ({ signal }) => fetchTeacherClasses(signal),
  });

  useEffect(() => {
    if (classesQuery.data && classesQuery.data.length > 0 && !selectedSectionId) {
      const firstSection = classesQuery.data[0];
      if (firstSection) {
        setSelectedSectionId(firstSection.sectionId);
      }
    }
  }, [classesQuery.data, selectedSectionId]);

  // 2. Fetch roster for section and date
  const rosterQuery = useQuery({
    queryKey: ['teacher', 'attendance', selectedSectionId, selectedDate],
    queryFn: ({ signal }) => fetchAttendanceRoster(selectedSectionId, selectedDate, signal),
    enabled: Boolean(selectedSectionId),
  });

  useEffect(() => {
    if (rosterQuery.data?.students) {
      const initial: Record<string, MarkAttendanceRecordInput> = {};
      for (const s of rosterQuery.data.students) {
        initial[s.studentId] = {
          studentId: s.studentId,
          status: s.status,
          lateMinutes: s.lateMinutes ?? undefined,
          remarks: s.remarks ?? undefined,
        };
      }
      setLocalRecords(initial);
    }
  }, [rosterQuery.data]);

  const submitMutation = useMutation({
    mutationFn: (records: MarkAttendanceRecordInput[]) =>
      submitAttendanceRoster({
        sectionId: selectedSectionId,
        attendanceDate: selectedDate,
        records,
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      showToast({
        title: 'Attendance Saved',
        description: `Successfully logged presence for ${data.count} students on ${data.date}.`,
        variant: 'success',
      });
    },
    onError: () => {
      showToast({
        title: 'Submission Failed',
        description: 'Failed to record attendance. Please check network connection.',
        variant: 'danger',
      });
    },
  });

  const handleStatusChange = (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
  ) => {
    setLocalRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        status,
        lateMinutes: status === 'LATE' ? prev[studentId]?.lateMinutes || 15 : undefined,
      },
    }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    if (!rosterQuery.data?.students) return;
    const updated: Record<string, MarkAttendanceRecordInput> = {};
    for (const s of rosterQuery.data.students) {
      updated[s.studentId] = {
        studentId: s.studentId,
        status,
        lateMinutes: undefined,
        remarks: localRecords[s.studentId]?.remarks,
      };
    }
    setLocalRecords(updated);
  };

  const handleSave = () => {
    const recordsList = Object.values(localRecords);
    if (recordsList.length === 0) return;
    submitMutation.mutate(recordsList);
  };

  return (
    <AppShell
      title="Attendance"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Attendance' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2" className="text-xl font-bold">
              Morning Attendance Grid
            </Heading>
            <Text variant="small" className="text-[var(--color-text-muted)] mt-1">
              Mark student presence, tardiness, and excused absences for your teaching sections.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('PRESENT')}>
              Mark All Present
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitMutation.isPending}
              onClick={handleSave}
            >
              Save Attendance
            </Button>
          </div>
        </div>

        {/* Section and Date Selectors */}
        <Card padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <FormField label="Assigned Section">
              {(props) => (
                <Select
                  {...props}
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  options={
                    classesQuery.data?.map((c) => ({
                      value: c.sectionId,
                      label: `${c.className} - ${c.sectionName} (${c.subjectName})`,
                    })) ?? []
                  }
                />
              )}
            </FormField>

            <FormField label="Attendance Date">
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              )}
            </FormField>

            <div className="text-xs text-[var(--color-text-muted)] pb-2 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
              <span>Records synchronize with School Admin and Parent Portal.</span>
            </div>
          </div>
        </Card>

        {/* Student Roster Table */}
        {rosterQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rosterQuery.isError ? (
          <ErrorState
            title="Failed to load attendance roster"
            description="Could not fetch student roster for this section."
            onRetry={() => void rosterQuery.refetch()}
          />
        ) : (rosterQuery.data?.students.length ?? 0) === 0 ? (
          <EmptyState
            title="No students found"
            description="No active students are currently enrolled in this section."
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-[var(--color-border-default)]">
              {rosterQuery.data?.students.map((student) => {
                const current = localRecords[student.studentId] || {
                  studentId: student.studentId,
                  status: 'PRESENT',
                };

                return (
                  <div
                    key={student.studentId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-sunken)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border-default)] font-semibold text-xs text-[var(--color-text-primary)]">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          ID: {student.studentIdNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          current.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-emerald-500'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          current.status === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-rose-500'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'LATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          current.status === 'LATE'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-amber-500'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          current.status === 'EXCUSED'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-blue-500'
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default TeacherAttendancePage;
