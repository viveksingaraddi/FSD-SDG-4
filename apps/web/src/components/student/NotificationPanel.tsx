import { useNavigate } from 'react-router-dom';
import type { NotificationItem } from '../../features/student/types/student.types.js';
import { BellIcon, CheckCircleIcon } from '../icons/Icons.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

export interface NotificationPanelProps {
  open: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const CATEGORY_LABEL: Record<NotificationItem['category'], string> = {
  assignment: 'Assignment',
  announcement: 'Notice',
  feedback: 'Feedback',
  assessment: 'Assessment',
};

export function NotificationPanel({
  open,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      role="region"
      aria-label="Notifications panel"
      className="absolute right-0 top-12 z-[var(--z-dropdown)] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</h2>
          {unreadCount > 0 && <Badge variant="brand">{unreadCount} new</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <CheckCircleIcon className="mx-auto h-6 w-6 text-[var(--color-semantic-success)]" />
          <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">All caught up</p>
          <p className="text-xs text-[var(--color-text-muted)]">No pending notifications.</p>
        </div>
      ) : (
        <ul className="max-h-80 divide-y divide-[var(--color-border-subtle)] overflow-y-auto">
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (!item.isRead) {
                    onMarkRead(item.id);
                  }
                  onClose();
                  navigate(item.linkTo);
                }}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-raised)] cursor-pointer ${
                  item.isRead ? 'bg-white' : 'bg-blue-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.isRead ? 'neutral' : 'brand'}>
                    {CATEGORY_LABEL[item.category]}
                  </Badge>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{item.timeAgo}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{item.message}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
