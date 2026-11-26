import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, BookOpen, Users, CheckCircle2 } from 'lucide-react';
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
import { fetchTeacherTimetable } from './teacherApi';
import type { TeacherTimetableItemDto } from '@fsd-sdg4/contracts';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export function TeacherTimetablePage() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS_OF_WEEK)[number]>('Monday');

  const timetableQuery = useQuery({
    queryKey: ['teacher', 'timetable'],
    queryFn: ({ signal }) => fetchTeacherTimetable(signal),
  });

  const slots = timetableQuery.data ?? [];

  return (
    <AppShell
      title="Class Timetable"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Timetable' }]}
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-surface p-6 shadow-sm">
          <div>
            <Heading level={2} className="text-xl font-semibold tracking-tight text-text">
              Weekly Teaching Schedule
            </Heading>
            <Text className="text-sm text-text-muted mt-1">
              Synchronized timetable across all assigned cohorts, room allocations, and
              instructional periods.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/teacher/attendance')}>
              <Calendar className="mr-2 h-4 w-4" />
              Roster & Attendance
            </Button>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div
          className="flex flex-wrap gap-2 border-b border-border/60 pb-3"
          role="tablist"
          aria-label="Days of week"
        >
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={selectedDay === day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                selectedDay === day
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'bg-surface hover:bg-surface-muted text-text-muted hover:text-text border border-border/60'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        {timetableQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {timetableQuery.isError && (
          <ErrorState
            title="Failed to load timetable"
            description="Could not synchronize class schedule from the server."
            onRetry={() => timetableQuery.refetch()}
          />
        )}

        {timetableQuery.isSuccess && slots.length === 0 && (
          <EmptyState
            title="No Scheduled Classes"
            description="You have no assigned course offerings for this academic term."
            action={
              <Button variant="outline" onClick={() => navigate('/teacher/classes')}>
                <BookOpen className="mr-2 h-4 w-4" />
                View Assigned Classes
              </Button>
            }
          />
        )}

        {timetableQuery.isSuccess && slots.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-text-muted px-1 font-medium uppercase tracking-wider">
              <span>{selectedDay} Instruction Timeline</span>
              <span>{slots.length} Course Periods Allocated</span>
            </div>

            <div className="grid gap-4">
              {slots.map((item: TeacherTimetableItemDto, idx: number) => {
                const isCurrent = item.status === 'IN_PROGRESS';
                const isPast = item.status === 'COMPLETED';

                return (
                  <Card
                    key={item.id}
                    className={`relative transition-all border p-5 ${
                      isCurrent
                        ? 'border-brand/40 bg-brand/5 shadow-sm ring-1 ring-brand/30'
                        : isPast
                          ? 'border-border/60 bg-surface/60 opacity-85'
                          : 'border-border/80 bg-surface hover:border-brand/30'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: Time & Period Indicator */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                            isCurrent
                              ? 'bg-brand text-brand-foreground shadow-sm'
                              : isPast
                                ? 'bg-surface-muted text-text-muted border border-border/60'
                                : 'bg-brand/10 text-brand'
                          }`}
                        >
                          P{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <Heading level={3} className="text-base font-semibold text-text">
                              {item.subjectName}
                            </Heading>
                            <Badge variant="neutral">{item.subjectCode}</Badge>
                            {isCurrent && (
                              <Badge variant="brand" className="animate-pulse">
                                Active Period
                              </Badge>
                            )}
                            {isPast && <Badge variant="neutral">Completed</Badge>}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-text-muted">
                            <span className="flex items-center gap-1 font-medium text-text">
                              <Clock className="h-3.5 w-3.5 text-text-muted" />
                              {item.startTime} – {item.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-text-muted" />
                              {item.className} • Section {item.sectionName}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-text-muted" />
                              {item.roomNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Context Actions */}
                      <div className="flex items-center gap-2 sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/teacher/attendance')}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Attendance
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/teacher/assignments')}
                        >
                          Coursework
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default TeacherTimetablePage;
