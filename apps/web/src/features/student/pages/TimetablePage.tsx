import { useEffect, useState } from 'react';
import { ClockIcon, MapPinIcon } from '../../../components/icons/Icons.js';
import {
  EmptyState,
  LoadingState,
  StudentLayout,
  Timetable,
} from '../../../components/student/index.js';
import { Badge, Card } from '../../../components/ui/index.js';
import { useStudentPreferences, useStudentTimetable } from '../hooks/useStudentPortal.js';
import type { DayOfWeek } from '../types/student.types.js';

export function TimetablePage() {
  const { data: slots, isLoading } = useStudentTimetable();
  const { data: preferences } = useStudentPreferences();
  const [hasManualOverride, setHasManualOverride] = useState(false);
  const [mode, setMode] = useState<'weekly' | 'daily'>(
    preferences?.defaultTimetableView ?? 'weekly',
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Thursday');

  useEffect(() => {
    if (preferences && !hasManualOverride) {
      setMode(preferences.defaultTimetableView);
    }
  }, [preferences, hasManualOverride]);

  const currentClass = (slots ?? []).find((s) => s.isCurrent);

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Timetable' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Timetable
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Section 8-A weekly class schedule, room locations, and active period indicator.
            </p>
          </div>

          <div
            className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white p-1"
            role="group"
            aria-label="Timetable view mode"
          >
            <button
              type="button"
              onClick={() => {
                setHasManualOverride(true);
                setMode('weekly');
              }}
              aria-pressed={mode === 'weekly'}
              className={`min-h-[36px] rounded-[var(--radius-sm)] px-3.5 text-xs font-semibold transition-colors cursor-pointer ${mode === 'weekly'
                  ? 'bg-[var(--color-brand-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              Weekly Grid
            </button>
            <button
              type="button"
              onClick={() => {
                setHasManualOverride(true);
                setMode('daily');
              }}
              aria-pressed={mode === 'daily'}
              className={`min-h-[36px] rounded-[var(--radius-sm)] px-3.5 text-xs font-semibold transition-colors cursor-pointer ${mode === 'daily'
                  ? 'bg-[var(--color-brand-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              Daily Schedule
            </button>
          </div>
        </div>

        {currentClass && (
          <Card className="border-l-4 border-l-[var(--color-brand-primary)] bg-blue-50/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">Current Class</Badge>
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">
                    {currentClass.day} · {currentClass.periodLabel}
                  </span>
                </div>
                <p className="text-base font-semibold text-[var(--color-text-primary)]">
                  {currentClass.subjectName} — {currentClass.teacherName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <ClockIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  {currentClass.startTime} – {currentClass.endTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  {currentClass.classroom}
                </span>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <LoadingState label="Loading class timetable..." cards={5} />
        ) : !slots || slots.length === 0 ? (
          <EmptyState
            title="No timetable published"
            description="Your Section 8-A schedule will appear here once finalized."
          />
        ) : (
          <Timetable
            slots={slots}
            mode={mode}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        )}
      </div>
    </StudentLayout>
  );
}
