import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Heading,
  Select,
  Text,
} from '@/components/ui';

const NOTIFICATION_TYPES = [
  { value: 'ALL', label: 'All Notifications' },
  { value: 'ATTENDANCE', label: 'Attendance Alerts' },
  { value: 'ASSIGNMENT', label: 'Teacher Assignments & Deadlines' },
  { value: 'RESULT', label: 'Published Examination Results' },
  { value: 'MESSAGE', label: 'Teacher Messages' },
  { value: 'ANNOUNCEMENT', label: 'School Announcements' },
  { value: 'EVENT', label: 'Upcoming Events' },
  { value: 'FEE', label: 'Fee Reminders' },
] as const;

export function ParentNotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  return (
    <AppShell
      title="Notifications"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Notifications' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Notifications Center
            </Heading>
            <Text variant="small" className="mt-1">
              Stay informed about attendance alerts, assignments, published results, and school
              updates.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filter by notification type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[...NOTIFICATION_TYPES]}
            />
            <Button
              variant="outline"
              size="sm"
              disabled
              leftIcon={<CheckCheck className="h-4 w-4" />}
            >
              Mark All as Read
            </Button>
          </div>
        </div>

        <Alert variant="warning" title="Notification Feed Pending Backend Provisioning">
          Centralized notification storage and delivery endpoints are not yet enabled in the
          platform API. You can review live attendance, assignments, grades, and support plans
          directly from their respective sections.
        </Alert>

        <Card>
          <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
            <Bell className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
            <Heading level={3} size="h3">
              Activity Feed
            </Heading>
          </div>

          <div className="mt-6">
            <EmptyState
              title="No notifications to display"
              description="When the notification service is enabled, alerts for attendance, assignments, results, messages, events, and fees will appear here."
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[var(--color-border-default)] pt-4">
            <Link to="/parent/attendance">
              <Button variant="outline" size="sm">
                Go to Attendance
              </Button>
            </Link>
            <Link to="/parent/assignments">
              <Button variant="outline" size="sm">
                Go to Assignments
              </Button>
            </Link>
            <Link to="/parent/progress">
              <Button variant="outline" size="sm">
                Go to Academic Progress
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default ParentNotificationsPage;
