import { Megaphone } from 'lucide-react';
import { Badge, Card, EmptyState, Heading, Text } from '@/components/ui';
import type { DemoSchoolAnnouncement } from '@/data/parentDemoData';

export interface SchoolAnnouncementsCardProps {
  announcements: DemoSchoolAnnouncement[];
}

const CATEGORY_VARIANT: Record<
  DemoSchoolAnnouncement['category'],
  'brand' | 'warning' | 'neutral'
> = {
  ACADEMIC: 'brand',
  EVENT: 'warning',
  GENERAL: 'neutral',
};

export function SchoolAnnouncementsCard({ announcements }: SchoolAnnouncementsCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
          <Heading level={3} size="h3">
            School Updates &amp; Announcements
          </Heading>
        </div>
      </div>

      <Text variant="small" className="mt-1">
        Recent notices from school administration.
      </Text>

      {announcements.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No recent announcements"
            description="School updates will appear here when published."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {announcements.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={CATEGORY_VARIANT[item.category]}>{item.category}</Badge>
                  <span className="text-xs text-[var(--color-text-muted)]">{item.publishedAt}</span>
                </div>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {item.summary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
