import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentService } from '../../features/student/services/studentService.js';
import type {
  NotificationItem,
  StudentProfile,
} from '../../features/student/types/student.types.js';
import {
  BellIcon,
  ChevronDownIcon,
  HelpCircleIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from '../icons/Icons.js';
import { Avatar } from '../ui/Avatar.js';
import { Badge } from '../ui/Badge.js';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs.js';
import { NotificationPanel } from './NotificationPanel.js';

export interface HeaderProps {
  profile: StudentProfile;
  breadcrumbs: BreadcrumbItem[];
  notifications: NotificationItem[];
  onOpenMobileMenu: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onLogoutClick: () => void;
}

interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  kind: 'Course' | 'Assignment' | 'Resource' | 'Announcement';
  to: string;
}

export function Header({
  profile,
  breadcrumbs,
  notifications,
  onOpenMobileMenu,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogoutClick,
}: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let active = true;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    void studentService.searchGlobal(trimmed).then((res) => {
      if (active) {
        setSearchResults(res);
      }
    });

    return () => {
      active = false;
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMobileSearchOpen(false);
        setNotifOpen(false);
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-[var(--z-header)] shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: mobile drawer button + breadcrumbs */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] lg:hidden cursor-pointer"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        {/* Right: global search + notifications + help + avatar menu */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((prev) => !prev);
              setNotifOpen(false);
              setAccountOpen(false);
            }}
            aria-label="Toggle global search"
            aria-expanded={mobileSearchOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] md:hidden cursor-pointer"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          {/* Desktop Global search */}
          <div ref={searchRef} className="relative hidden md:block md:w-64 lg:w-72">
            <label htmlFor="student-global-search" className="sr-only">
              Search courses, assignments, resources, and notices
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              id="student-global-search"
              type="search"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search courses, tasks, notes..."
              className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:bg-white focus:outline-none"
            />

            {searchOpen && searchQuery.trim().length > 0 && (
              <div
                role="region"
                aria-label="Global search results"
                className="absolute right-0 top-11 z-[var(--z-dropdown)] w-80 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-white shadow-xl"
              >
                {searchResults.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                    No matches found for &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  <ul className="max-h-72 divide-y divide-[var(--color-border-subtle)] overflow-y-auto">
                    {searchResults.map((result) => (
                      <li key={`${result.kind}-${result.id}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            navigate(result.to);
                          }}
                          className="flex w-full items-start justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-[var(--color-surface-raised)] cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                              {result.title}
                            </p>
                            <p className="truncate text-xs text-[var(--color-text-muted)]">
                              {result.subtitle}
                            </p>
                          </div>
                          <Badge variant="neutral">{result.kind}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setAccountOpen(false);
              }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={notifOpen}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[10px] font-bold text-white"
                >
                  {unreadCount}
                </span>
              )}
            </button>

            <NotificationPanel
              open={notifOpen}
              notifications={notifications}
              onClose={() => setNotifOpen(false)}
              onMarkRead={onMarkNotificationRead}
              onMarkAllRead={onMarkAllNotificationsRead}
            />
          </div>

          {/* Help link */}
          <Link
            to="/student/support"
            aria-label="Help and Support"
            title="Help & Support"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
          >
            <HelpCircleIcon className="h-5 w-5" />
          </Link>

          {/* Student avatar dropdown */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setAccountOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              aria-label="Open student account menu"
              aria-expanded={accountOpen}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-md)] px-1.5 py-1 hover:bg-[var(--color-surface-raised)] cursor-pointer"
            >
              <Avatar name={profile.fullName} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[120px] truncate text-xs font-semibold text-[var(--color-text-primary)]">
                  {profile.fullName}
                </span>
                <span className="block text-[11px] text-[var(--color-text-muted)]">
                  {profile.sectionName}
                </span>
              </span>
              <ChevronDownIcon className="hidden h-4 w-4 text-[var(--color-text-muted)] sm:block" />
            </button>

            {accountOpen && (
              <div
                role="menu"
                aria-label="Student account menu"
                className="absolute right-0 top-12 z-[var(--z-dropdown)] w-60 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-white py-1.5 shadow-xl"
              >
                <div className="border-b border-[var(--color-border-subtle)] px-4 py-2.5">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {profile.fullName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">{profile.email}</p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate('/student/settings');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] cursor-pointer"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Student Profile</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate('/student/settings');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] cursor-pointer"
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>Preferences & Settings</span>
                </button>

                <div className="my-1 border-t border-[var(--color-border-subtle)]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onLogoutClick();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-[var(--color-semantic-danger)] hover:bg-red-50 cursor-pointer"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mobile Global Search Bar */}
      {mobileSearchOpen && (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-3 md:hidden">
          <div className="relative">
            <label htmlFor="student-mobile-global-search" className="sr-only">
              Search courses, assignments, resources, and notices
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              id="student-mobile-global-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, tasks, notes..."
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none"
            />
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-white">
              {searchResults.length === 0 ? (
                <p className="px-3 py-3 text-xs text-[var(--color-text-muted)]">
                  No matches found for &ldquo;{searchQuery}&rdquo;.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-border-subtle)]">
                  {searchResults.map((result) => (
                    <li key={`mobile-${result.kind}-${result.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileSearchOpen(false);
                          setSearchQuery('');
                          navigate(result.to);
                        }}
                        className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left hover:bg-[var(--color-surface-raised)] cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                            {result.title}
                          </p>
                          <p className="truncate text-xs text-[var(--color-text-muted)]">
                            {result.subtitle}
                          </p>
                        </div>
                        <Badge variant="neutral">{result.kind}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
