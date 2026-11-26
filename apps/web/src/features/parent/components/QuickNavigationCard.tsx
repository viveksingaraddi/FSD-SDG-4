import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
} from 'lucide-react';
import { Card, Heading, Text } from '@/components/ui';

const QUICK_LINKS = [
  {
    to: '/parent/attendance',
    title: 'Attendance',
    description: 'Daily attendance records & absence notes.',
    icon: CalendarCheck,
  },
  {
    to: '/parent/progress',
    title: 'Academic Progress',
    description: 'Published grades & teacher feedback.',
    icon: GraduationCap,
  },
  {
    to: '/parent/assignments',
    title: 'Assignments',
    description: 'Homework deadlines & home activities.',
    icon: ClipboardList,
  },
  {
    to: '/parent/support',
    title: 'Support Plans',
    description: 'Approved learning goals & actions.',
    icon: HeartHandshake,
  },
  {
    to: '/parent/messages',
    title: 'Messages',
    description: 'Parent–teacher communication.',
    icon: MessageSquare,
  },
  {
    to: '/parent/notifications',
    title: 'Notifications',
    description: 'Alerts, deadlines & announcements.',
    icon: Bell,
  },
  {
    to: '/parent/calendar',
    title: 'Calendar & Events',
    description: 'Exam dates & school schedule.',
    icon: Calendar,
  },
  {
    to: '/parent/fees',
    title: 'Fees & Payments',
    description: 'Fee summaries & receipts.',
    icon: CreditCard,
  },
  {
    to: '/parent/documents',
    title: 'Documents',
    description: 'Report cards & exam reports.',
    icon: FileText,
  },
] as const;

export function QuickNavigationCard() {
  return (
    <Card>
      <Heading level={3} size="h3">
        Quick Navigation
      </Heading>
      <Text variant="small" className="mt-1">
        Jump directly to any section of the Parent &amp; Guardian Portal.
      </Text>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
