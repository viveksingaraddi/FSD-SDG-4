import { useMemo, useState } from 'react';
import type { AttendanceRecord } from '../../features/student/types/student.types.js';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons.js';
import { Badge, type BadgeVariant } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

export interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  initialMonth?: string; // YYYY-MM
}

const MONTH_OPTIONS = [
  { key: '2026-10', label: 'October 2026', year: 2026, monthIndex: 9 },
  { key: '2026-11', label: 'November 2026', year: 2026, monthIndex: 10 },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_STYLE: Record<
  AttendanceRecord['status'],
  { cell: string; badgeVariant: BadgeVariant; label: string }
> = {
  PRESENT: {
    cell: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
    badgeVariant: 'success',
    label: 'Present',
  },
  LATE: {
    cell: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    badgeVariant: 'warning',
    label: 'Late',
  },
  ABSENT: {
    cell: 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100',
    badgeVariant: 'danger',
    label: 'Absent',
  },
  EXCUSED: {
    cell: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
    badgeVariant: 'info',
    label: 'Excused',
  },
  HOLIDAY: {
    cell: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    badgeVariant: 'neutral',
    label: 'Holiday',
  },
};

export function AttendanceCalendar({ records, initialMonth = '2026-11' }: AttendanceCalendarProps) {
  const [monthIdx, setMonthIdx] = useState(() => {
    const idx = MONTH_OPTIONS.findIndex((m) => m.key === initialMonth);
    return idx >= 0 ? idx : MONTH_OPTIONS.length - 1;
  });

  const activeMonth = MONTH_OPTIONS[monthIdx]!;

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  const [selectedDate, setSelectedDate] = useState<string>('2026-11-26');

  const days = useMemo(() => {
    const firstDay = new Date(activeMonth.year, activeMonth.monthIndex, 1);
    const daysInMonth = new Date(activeMonth.year, activeMonth.monthIndex + 1, 0).getDate();
    // Monday = 0 ... Sunday = 6
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: Array<{
      dateKey: string | null;
      dayNumber: number | null;
      record?: AttendanceRecord | undefined;
    }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateKey: null, dayNumber: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(activeMonth.monthIndex + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateKey = `${activeMonth.year}-${mm}-${dd}`;
      const record = recordMap.get(dateKey);
      cells.push(record ? { dateKey, dayNumber: d, record } : { dateKey, dayNumber: d });
    }
    return cells;
  }, [activeMonth, recordMap]);

  const selectedRecord = recordMap.get(selectedDate);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Monthly Attendance Calendar
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Select any marked school day to view details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={monthIdx <= 0}
            onClick={() => setMonthIdx((prev) => Math.max(0, prev - 1))}
            aria-label="Previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="min-w-[128px] text-center text-sm font-semibold text-[var(--color-text-primary)]">
            {activeMonth.label}
          </span>
          <button
            type="button"
            disabled={monthIdx >= MONTH_OPTIONS.length - 1}
            onClick={() => setMonthIdx((prev) => Math.min(MONTH_OPTIONS.length - 1, prev + 1))}
            aria-label="Next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'HOLIDAY'] as const).map((status) => {
          const info = STATUS_STYLE[status];
          return (
            <span key={status} className="inline-flex items-center gap-1.5">
              <Badge variant={info.badgeVariant}>{info.label}</Badge>
            </span>
          );
        })}
      </div>

      {/* Weekday header */}
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[var(--color-text-muted)]">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="mt-1 grid grid-cols-7 gap-1.5" role="grid" aria-label={activeMonth.label}>
        {days.map((cell, idx) => {
          if (!cell.dateKey || !cell.dayNumber) {
            return <div key={`empty-${idx}`} className="h-11 rounded-[var(--radius-md)]" />;
          }

          const isSelected = cell.dateKey === selectedDate;
          const recordInfo = cell.record ? STATUS_STYLE[cell.record.status] : undefined;
          const style = recordInfo
            ? recordInfo.cell
            : 'bg-white text-[var(--color-text-muted)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)]';

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => setSelectedDate(cell.dateKey!)}
              aria-pressed={isSelected}
              aria-label={`${cell.dateKey}${recordInfo ? ` - ${recordInfo.label}` : ''}`}
              className={`flex h-11 flex-col items-center justify-center rounded-[var(--radius-md)] border text-xs font-medium transition-colors cursor-pointer ${style} ${
                isSelected ? 'ring-2 ring-[var(--color-brand-primary)] ring-offset-1' : ''
              }`}
            >
              <span>{cell.dayNumber}</span>
              {recordInfo && (
                <span className="text-[10px] leading-none opacity-80">
                  {recordInfo.label.slice(0, 1)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail */}
      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            Selected Date: <span className="font-mono">{selectedDate}</span>
          </p>
          {selectedRecord ? (
            <Badge variant={STATUS_STYLE[selectedRecord.status].badgeVariant}>
              {STATUS_STYLE[selectedRecord.status].label}
            </Badge>
          ) : (
            <Badge variant="neutral">No session / Weekend</Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {selectedRecord
            ? `${selectedRecord.subjectName ?? 'School Session'}${
                selectedRecord.note ? ` — ${selectedRecord.note}` : ' — Recorded on time.'
              }`
            : 'No regular classroom attendance log recorded on this date.'}
        </p>
      </div>
    </Card>
  );
}
