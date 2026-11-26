import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import { Badge, Button, Card, Heading, Text } from '@/components/ui';
import type { DemoAttendanceSummary } from '@/data/parentDemoData';

export interface AttendanceSummaryCardProps {
  attendance: DemoAttendanceSummary;
}

export function AttendanceSummaryCard({ attendance }: AttendanceSummaryCardProps) {
  const rateVariant =
    attendance.attendanceRate >= 90
      ? 'success'
      : attendance.attendanceRate >= 75
        ? 'warning'
        : 'danger';

  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
            <Heading level={3} size="h3">
              Attendance Summary
            </Heading>
          </div>
          <Badge variant={rateVariant}>{attendance.attendanceRate}%</Badge>
        </div>

        <Text variant="small" className="mt-1">
          {attendance.lastUpdatedLabel} · {attendance.totalDays} school days recorded
        </Text>

        {/* Progress bar */}
        <div
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
          role="progressbar"
          aria-valuenow={attendance.attendanceRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Attendance rate ${attendance.attendanceRate}%`}
        >
          <div
            className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, attendance.attendanceRate))}%` }}
          />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-2.5">
            <dt className="text-xs text-[var(--color-text-muted)]">Present</dt>
            <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text-primary)]">
              {attendance.presentDays}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-2.5">
            <dt className="text-xs text-[var(--color-text-muted)]">Absent</dt>
            <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text-primary)]">
              {attendance.absentDays}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-2.5">
            <dt className="text-xs text-[var(--color-text-muted)]">Late</dt>
            <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text-primary)]">
              {attendance.lateDays}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-2.5">
            <dt className="text-xs text-[var(--color-text-muted)]">Excused</dt>
            <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text-primary)]">
              {attendance.excusedDays}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 border-t border-[var(--color-border-default)] pt-3">
        <Link to="/parent/attendance">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View Attendance Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}
