import type {
  Announcement,
  AnnouncementCategory,
} from '../../features/student/types/student.types.js';
import { Badge, type BadgeVariant } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

export interface AnnouncementCardProps {
  announcement: Announcement;
  onSelect: (announcement: Announcement) => void;
  onToggleRead: (id: string, isRead: boolean) => void;
}

const CATEGORY_META: Record<AnnouncementCategory, { label: string; variant: BadgeVariant }> = {
  SCHOOL: { label: 'School', variant: 'brand' },
  TEACHER: { label: 'Teacher', variant: 'info' },
  NOTICE: { label: 'Notice', variant: 'warning' },
};

export function AnnouncementCard({ announcement, onSelect, onToggleRead }: AnnouncementCardProps) {
  const cat = CATEGORY_META[announcement.category];

  return (
    <Card
      interactive
      className={!announcement.isRead ? 'border-l-4 border-l-[var(--color-brand-primary)]' : ''}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={cat.variant}>{cat.label}</Badge>
          {announcement.priority === 'Important' && <Badge variant="danger">Important</Badge>}
          {!announcement.isRead && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)]">
              <span
                className="h-2 w-2 rounded-full bg-[var(--color-brand-primary)]"
                aria-hidden="true"
              />
              Unread
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">{announcement.publishedAt}</span>
      </div>

      <h2 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
        <button
          type="button"
          onClick={() => onSelect(announcement)}
          className="text-left hover:text-[var(--color-brand-primary)] hover:underline cursor-pointer"
        >
          {announcement.title}
        </button>
      </h2>

      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{announcement.summary}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] pt-3">
        <span className="text-xs text-[var(--color-text-muted)]">
          {announcement.authorName} · {announcement.authorRole}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleRead(announcement.id, !announcement.isRead)}
          >
            {announcement.isRead ? 'Mark unread' : 'Mark read'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSelect(announcement)}>
            Read notice
          </Button>
        </div>
      </div>
    </Card>
  );
}
