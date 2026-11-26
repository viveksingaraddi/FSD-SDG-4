import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, MessageSquarePlus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { fetchChildAttendance, fetchLinkedChildren, submitAbsenceNote } from './parentApi';

const STATUS_BADGE: Record<
  'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
  { label: string; variant: 'success' | 'danger' | 'warning' | 'brand' }
> = {
  PRESENT: { label: 'Present', variant: 'success' },
  ABSENT: { label: 'Absent', variant: 'danger' },
  LATE: { label: 'Late', variant: 'warning' },
  EXCUSED: { label: 'Excused', variant: 'brand' },
};

export function ParentAttendancePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [noteReason, setNoteReason] = useState('');

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  const attendanceQuery = useQuery({
    queryKey: ['parent', 'attendance', activeStudentId, selectedMonth],
    queryFn: ({ signal }) => fetchChildAttendance(activeStudentId, selectedMonth, signal),
    enabled: Boolean(activeStudentId),
  });

  const noteMutation = useMutation({
    mutationFn: (payload: { attendanceRecordId: string; reason: string }) =>
      submitAbsenceNote(activeStudentId, payload),
    onSuccess: () => {
      showToast({ variant: 'success', title: 'Absence note submitted' });
      setNoteTargetId(null);
      setNoteReason('');
      void queryClient.invalidateQueries({
        queryKey: ['parent', 'attendance', activeStudentId, selectedMonth],
      });
    },
    onError: (err) => {
      showToast({
        variant: 'danger',
        title: 'Unable to submit absence note',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const stats = attendanceQuery.data?.stats;
  const records = attendanceQuery.data?.records ?? [];

  return (
    <AppShell
      title="Attendance"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Attendance' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Attendance Records
            </Heading>
            <Text variant="small" className="mt-1">
              Review monthly attendance statistics, daily status, and submit absence explanations.
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
          </div>
        </div>

        {(childrenQuery.isLoading || attendanceQuery.isLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {(childrenQuery.isError || attendanceQuery.isError) && (
          <ErrorState
            title="Unable to load attendance"
            description="Please verify your connection and try again."
            onRetry={() => void attendanceQuery.refetch()}
          />
        )}

        {!childrenQuery.isLoading && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {stats && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Monthly Summary ({selectedMonth})
                  </Heading>
                </div>
                <Badge
                  variant={
                    stats.attendanceRate >= 90
                      ? 'success'
                      : stats.attendanceRate >= 75
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {stats.attendanceRate}% Attendance Rate
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">Total Days</dt>
                  <dd className="mt-1 text-xl font-semibold">{stats.totalDays}</dd>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">Present</dt>
                  <dd className="mt-1 text-xl font-semibold">{stats.present}</dd>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">Absent</dt>
                  <dd className="mt-1 text-xl font-semibold">{stats.absent}</dd>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">Late</dt>
                  <dd className="mt-1 text-xl font-semibold">{stats.late}</dd>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">Excused</dt>
                  <dd className="mt-1 text-xl font-semibold">{stats.excused}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <Heading level={3} size="h3">
                Date-wise Attendance
              </Heading>
              {records.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No attendance records for this month"
                    description="Records will appear once teachers log daily attendance."
                  />
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
                  {records.map((rec) => {
                    const badge = STATUS_BADGE[rec.status];
                    return (
                      <li
                        key={rec.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {rec.attendanceDate}
                          </p>
                          {rec.remarks && (
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              Note: {rec.remarks}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {rec.status === 'ABSENT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageSquarePlus className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setNoteTargetId(rec.id);
                                setNoteReason(rec.remarks ?? '');
                              }}
                            >
                              {rec.remarks ? 'Edit Note' : 'Add Note'}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </>
        )}

        <Modal
          open={noteTargetId !== null}
          onClose={() => setNoteTargetId(null)}
          title="Submit Absence Explanation"
        >
          <div className="space-y-4">
            <FormField label="Reason for absence" required>
              {(controlProps) => (
                <Input
                  {...controlProps}
                  value={noteReason}
                  onChange={(e) => setNoteReason(e.target.value)}
                  placeholder="e.g., Medical appointment or family emergency"
                />
              )}
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteTargetId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={noteMutation.isPending}
                disabled={!noteReason.trim()}
                onClick={() => {
                  if (noteTargetId) {
                    noteMutation.mutate({
                      attendanceRecordId: noteTargetId,
                      reason: noteReason.trim(),
                    });
                  }
                }}
              >
                Submit Note
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}

export default ParentAttendancePage;
