import { Link } from 'react-router-dom';
import type { DayOfWeek, TimetableSlot } from '../../features/student/types/student.types.js';
import { ClockIcon, MapPinIcon } from '../icons/Icons.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

export interface TimetableProps {
  slots: TimetableSlot[];
  mode: 'weekly' | 'daily';
  selectedDay: DayOfWeek;
  onSelectDay?: (day: DayOfWeek) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function Timetable({ slots, mode, selectedDay, onSelectDay }: TimetableProps) {
  if (mode === 'daily') {
    const daySlots = slots.filter((s) => s.day === selectedDay);

    return (
      <div className="space-y-4">
        {onSelectDay && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select weekday">
            {DAYS.map((day) => {
              const active = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectDay(day)}
                  className={`min-h-[40px] rounded-[var(--radius-md)] border px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
                      : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          {daySlots.map((slot) => (
            <Card
              key={slot.id}
              padding="sm"
              className={
                slot.isCurrent
                  ? 'border-l-4 border-l-[var(--color-brand-primary)] bg-blue-50/40'
                  : slot.isBreak
                    ? 'bg-[var(--color-surface-raised)]'
                    : ''
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-[92px] text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
                    {slot.startTime} – {slot.endTime}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">
                        {slot.periodLabel}
                      </span>
                      {slot.isCurrent && <Badge variant="brand">Current Class</Badge>}
                      {slot.isBreak && <Badge variant="neutral">Break</Badge>}
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {slot.courseId ? (
                        <Link
                          to={`/student/courses/${slot.courseId}`}
                          className="hover:text-[var(--color-brand-primary)] hover:underline"
                        >
                          {slot.subjectName}
                        </Link>
                      ) : (
                        slot.subjectName
                      )}
                    </h3>
                    {!slot.isBreak && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {slot.teacherName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  <span>{slot.classroom}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Weekly layout (responsive grid cards per day on mobile/tablet, 5-column board on desktop)
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day === day);
        const isToday = day === 'Thursday';

        return (
          <Card
            key={day}
            padding="sm"
            className={isToday ? 'border-[var(--color-brand-primary)]/40 bg-blue-50/20' : ''}
          >
            <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{day}</h2>
              {isToday && <Badge variant="brand">Today</Badge>}
            </div>

            <div className="space-y-2.5">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`rounded-[var(--radius-md)] border p-2.5 text-xs ${
                    slot.isCurrent
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)]'
                      : slot.isBreak
                        ? 'border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-raised)]'
                        : 'border-[var(--color-border-subtle)] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <ClockIcon className="h-3 w-3" />
                      {slot.startTime}–{slot.endTime}
                    </span>
                    {slot.isCurrent && (
                      <span className="font-semibold text-[var(--color-brand-primary)]">Now</span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-[var(--color-text-primary)]">
                    {slot.courseId ? (
                      <Link
                        to={`/student/courses/${slot.courseId}`}
                        className="hover:text-[var(--color-brand-primary)] hover:underline"
                      >
                        {slot.subjectName}
                      </Link>
                    ) : (
                      slot.subjectName
                    )}
                  </p>
                  {!slot.isBreak && (
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {slot.teacherName}
                    </p>
                  )}
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <MapPinIcon className="h-3 w-3" />
                    {slot.classroom}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
