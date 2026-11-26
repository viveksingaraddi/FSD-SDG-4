import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon } from '../../../components/icons/Icons.js';
import {
  AnnouncementCard,
  EmptyState,
  LoadingState,
  StudentLayout,
} from '../../../components/student/index.js';
import { Badge, Button, Card, Modal, Tabs, useToast } from '../../../components/ui/index.js';
import {
  useMarkAllAnnouncementsRead,
  useStudentAnnouncements,
  useToggleAnnouncementRead,
} from '../hooks/useStudentPortal.js';
import type { Announcement, AnnouncementCategory } from '../types/student.types.js';

type AnnouncementTab = 'ALL' | AnnouncementCategory | 'UNREAD';

export function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const noticeIdParam = searchParams.get('notice');
  const { showToast } = useToast();
  const { data: announcements, isLoading } = useStudentAnnouncements();
  const toggleReadMutation = useToggleAnnouncementRead();
  const markAllMutation = useMarkAllAnnouncementsRead();

  const [tab, setTab] = useState<AnnouncementTab>('ALL');
  const [search, setSearch] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!noticeIdParam || !announcements) return;
    const match = announcements.find((a) => a.id === noticeIdParam);
    if (match) {
      setSelectedNotice(match);
      if (!match.isRead) {
        toggleReadMutation.mutate({ id: match.id, isRead: true });
      }
      setSearchParams({}, { replace: true });
    }
  }, [noticeIdParam, announcements, setSearchParams, toggleReadMutation]);

  const unreadCount = (announcements ?? []).filter((a) => !a.isRead).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (announcements ?? []).filter((item) => {
      if (tab === 'UNREAD' && item.isRead) return false;
      if (tab !== 'ALL' && tab !== 'UNREAD' && item.category !== tab) return false;
      if (
        term &&
        !item.title.toLowerCase().includes(term) &&
        !item.summary.toLowerCase().includes(term) &&
        !item.authorName.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [announcements, tab, search]);

  const handleSelectNotice = (notice: Announcement) => {
    setSelectedNotice(notice);
    if (!notice.isRead) {
      toggleReadMutation.mutate({ id: notice.id, isRead: true });
    }
  };

  const handleToggleRead = (id: string, isRead: boolean) => {
    toggleReadMutation.mutate(
      { id, isRead },
      {
        onSuccess: (updated) => {
          if (selectedNotice?.id === updated.id) {
            setSelectedNotice(updated);
          }
        },
      },
    );
  };

  const handleMarkAllRead = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'All notices marked read',
          description: 'Your announcement inbox is up to date.',
        });
      },
    });
  };

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Announcements' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Announcements
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Stay updated with school-wide notices, teacher updates, and important reminders.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              isLoading={markAllMutation.isPending}
            >
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>

        <Tabs
          ariaLabel="Filter announcements"
          activeTab={tab}
          onChange={(id) => setTab(id as AnnouncementTab)}
          items={[
            { id: 'ALL', label: 'All', badge: (announcements ?? []).length },
            { id: 'UNREAD', label: 'Unread', badge: unreadCount },
            { id: 'SCHOOL', label: 'School' },
            { id: 'TEACHER', label: 'Teachers' },
            { id: 'NOTICE', label: 'Notices' },
          ]}
        />

        <Card padding="sm">
          <div className="relative max-w-md">
            <label htmlFor="announcement-search" className="sr-only">
              Search announcements
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              id="announcement-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements or senders..."
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:bg-white focus:outline-none"
            />
          </div>
        </Card>

        {isLoading ? (
          <LoadingState variant="list" label="Loading announcements..." cards={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No announcements match this view"
            description="Switch to All announcements or clear your search keyword."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setTab('ALL');
                  setSearch('');
                }}
              >
                Show all notices
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((notice) => (
              <AnnouncementCard
                key={notice.id}
                announcement={notice}
                onSelect={handleSelectNotice}
                onToggleRead={handleToggleRead}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title ?? ''}
        description={
          selectedNotice
            ? `${selectedNotice.authorName} · ${selectedNotice.authorRole} · ${selectedNotice.publishedAt}`
            : undefined
        }
        maxWidthClass="max-w-xl"
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand">{selectedNotice.category}</Badge>
              {selectedNotice.subjectName && (
                <Badge variant="neutral">{selectedNotice.subjectName}</Badge>
              )}
              {selectedNotice.priority === 'Important' && <Badge variant="danger">Important</Badge>}
            </div>

            <div className="space-y-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {selectedNotice.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-4">
              <Button
                variant="outline"
                onClick={() => handleToggleRead(selectedNotice.id, !selectedNotice.isRead)}
              >
                {selectedNotice.isRead ? 'Mark as unread' : 'Mark as read'}
              </Button>
              <Button onClick={() => setSelectedNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </StudentLayout>
  );
}
