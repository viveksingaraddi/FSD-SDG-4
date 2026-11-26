import { useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../../../components/icons/Icons.js';
import {
  AttendanceCalendar,
  EmptyState,
  LoadingState,
  StatCard,
  StudentLayout,
} from '../../../components/student/index.js';
import { Badge, Card, type BadgeVariant } from '../../../components/ui/index.js';
import { useStudentAttendance } from '../hooks/useStudentPortal.js';
import type { AttendanceRecord } from '../types/student.types.js';

const HISTORY_BADGE: Record<AttendanceRecord['status'], { label: string; variant: BadgeVariant }> =
  {
    PRESENT: { label: 'Present', variant: 'success' },
    LATE: { label: 'Late', variant: 'warning' },
    ABSENT: { label: 'Absent', variant: 'danger' },
    EXCUSED: { label: 'Excused', variant: 'info' },
    HOLIDAY: { label: 'Holiday', variant: 'neutral' },
  };

export function AttendancePage() {
  const { data: attendance, isLoading } = useStudentAttendance();
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceRecord['status']>('ALL');

  const filteredHistory = useMemo(() => {
    const records = [...(attendance?.records ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    if (statusFilter === 'ALL') return records;
    return records.filter((r) => r.status === statusFilter);
  }, [attendance, statusFilter]);

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Attendance' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Monitor your term attendance rate, subject participation, and daily check-in history.
          </p>
        </div>

        {isLoading ? (
          <LoadingState label="Loading attendance records..." cards={4} />
        ) : !attendance ? (
          <EmptyState
            title="Attendance records unavailable"
            description="Please check back later for updated attendance records."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Overall Attendance"
                value={`${attendance.overallPercentage}%`}
                hint={`${attendance.totalSchoolDays} total school days`}
                icon={<CalendarCheckIcon className="h-5 w-5" />}
                tone="brand"
              />
              <StatCard
                label="Present Days"
                value={attendance.presentDays}
                hint="On-time full attendance"
                icon={<CheckCircleIcon className="h-5 w-5" />}
                tone="success"
              />
              <StatCard
                label="Late Arrivals"
                value={attendance.lateDays}
                hint="Arrived after morning bell"
                icon={<ClockIcon className="h-5 w-5" />}
                tone="warning"
              />
              <StatCard
                label="Absent / Excused"
                value={`${attendance.absentDays} / ${attendance.excusedDays}`}
                hint="1 absent · 1 excused"
                icon={<AlertCircleIcon className="h-5 w-5" />}
                tone="info"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <AttendanceCalendar records={attendance.records} />
              </div>

              {/* Subject-wise Attendance */}
              <Card className="lg:col-span-5">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Subject-wise Attendance
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Classes attended across your six enrolled courses
                </p>

                <div className="mt-4 space-y-4">
                  {attendance.subjectBreakdown.map((subj) => (
                    <div key={subj.courseId}>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {subj.subjectName}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {subj.attendedClasses} of {subj.totalClasses} sessions
                          </p>
                        </div>
                        <Badge variant={subj.percentage >= 90 ? 'success' : 'warning'}>
                          {subj.percentage}%
                        </Badge>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-brand-primary)]"
                          style={{ width: `${subj.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Attendance History */}
            <Card>
              <div className="flex flex-col justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Attendance History
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Chronological daily attendance log
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="attendance-status-filter"
                    className="text-xs font-medium text-[var(--color-text-muted)]"
                  >
                    Filter:
                  </label>
                  <select
                    id="attendance-status-filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'ALL' | AttendanceRecord['status'])
                    }
                    className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSED">Excused</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-muted)]">
                      <th className="py-2.5 pr-4">Date</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 pr-4">Session</th>
                      <th className="py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {filteredHistory.slice(0, 14).map((record) => {
                      const badge = HISTORY_BADGE[record.status] ?? {
                        label: record.status,
                        variant: 'neutral' as const,
                      };
                      return (
                        <tr key={record.date}>
                          <td className="py-3 pr-4 font-mono text-xs text-[var(--color-text-primary)]">
                            {record.date}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-xs text-[var(--color-text-secondary)]">
                            {record.subjectName ?? 'School Calendar'}
                          </td>
                          <td className="py-3 text-xs text-[var(--color-text-muted)]">
                            {record.note ?? 'Recorded on schedule'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
