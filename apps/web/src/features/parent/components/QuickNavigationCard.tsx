import { Link } from 'react-router-dom';
import { CalendarCheck, GraduationCap, HeartHandshake } from 'lucide-react';
import { Card, Heading, Text } from '@/components/ui';

const QUICK_LINKS = [
  {
    to: '/parent/attendance',
    title: 'Attendance',
    description: 'View daily attendance records and submit absence notes.',
    icon: CalendarCheck,
  },
  {
    to: '/parent/progress',
    title: 'Academic Progress',
    description: 'Review subject grades, coursework, and teacher feedback.',
    icon: GraduationCap,
  },
  {
    to: '/parent/support',
    title: 'Support Plans',
    description: 'Collaborate on active family & student support actions.',
    icon: HeartHandshake,
  },
] as const;

export function QuickNavigationCard() {
  return (
    <Card>
      <Heading level={3} size="h3">
        Quick Navigation
      </Heading>
      <Text variant="small" className="mt-1">
        Jump directly to your child&apos;s key portal sections.
      </Text>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3.5 transition-colors hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] text-[var(--color-brand-primary)] group-hover:bg-[var(--color-surface-elevated)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
