import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import type { StudentProfile } from '../../features/student/types/student.types.js';
import {
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  ClockIcon,
  FileCheckIcon,
  FolderLibraryIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MegaphoneIcon,
  SettingsIcon,
  TrendingUpIcon,
  type IconProps,
} from '../icons/Icons.js';
import { Avatar } from '../ui/Avatar.js';

export interface StudentNavItem {
  id: string;
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { id: 'overview', label: 'Overview', to: '/student', icon: LayoutDashboardIcon, end: true },
  { id: 'courses', label: 'My Courses', to: '/student/courses', icon: BookOpenIcon },
  { id: 'assignments', label: 'Assignments', to: '/student/assignments', icon: ClipboardListIcon },
  { id: 'assessments', label: 'Assessments', to: '/student/assessments', icon: FileCheckIcon },
  {
    id: 'resources',
    label: 'Learning Resources',
    to: '/student/resources',
    icon: FolderLibraryIcon,
  },
  { id: 'attendance', label: 'Attendance', to: '/student/attendance', icon: CalendarCheckIcon },
  { id: 'progress', label: 'My Progress', to: '/student/progress', icon: TrendingUpIcon },
  {
    id: 'announcements',
    label: 'Announcements',
    to: '/student/announcements',
    icon: MegaphoneIcon,
  },
  { id: 'timetable', label: 'Timetable', to: '/student/timetable', icon: ClockIcon },
  { id: 'support', label: 'Help & Support', to: '/student/support', icon: LifeBuoyIcon },
  { id: 'settings', label: 'Settings', to: '/student/settings', icon: SettingsIcon },
];

export interface SidebarProps {
  profile: StudentProfile;
  unreadAnnouncements?: number;
  pendingAssignments?: number;
  onNavigate?: () => void;
  onLogoutClick: () => void;
}

export function SidebarContent({
  profile,
  unreadAnnouncements = 0,
  pendingAssignments = 0,
  onNavigate,
  onLogoutClick,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-[var(--color-surface-card)]">
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-border-subtle)] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] text-white shadow-xs">
          <GraduationCapIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
            FSD-SDG-4
          </p>
          <p className="truncate text-[11px] font-medium text-[var(--color-text-muted)]">
            Student Portal
          </p>
        </div>
      </div>

      {/* Student summary pill */}
      <div className="mx-3 mt-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={profile.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
              {profile.fullName}
            </p>
            <p className="truncate text-[11px] text-[var(--color-text-muted)]">
              {profile.gradeName} · {profile.sectionName}
            </p>
          </div>
        </div>
        <p className="mt-2 truncate font-mono text-[11px] text-[var(--color-text-muted)]">
          ID: {profile.studentIdNumber}
        </p>
      </div>

      {/* Primary navigation */}
      <nav aria-label="Student portal navigation" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {STUDENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.id === 'assignments'
                ? pendingAssignments
                : item.id === 'announcements'
                  ? unreadAnnouncements
                  : 0;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  end={item.end ?? false}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                  className={({ isActive }) =>
                    `flex min-h-[40px] items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                    }`
                  }
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badgeCount > 0 && (
                    <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[var(--color-brand-primary-light)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-primary-dark)]">
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom student profile & logout */}
      <div className="shrink-0 border-t border-[var(--color-border-subtle)] p-3">
        <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={profile.fullName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                {profile.fullName}
              </p>
              <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                {profile.schoolName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogoutClick}
            title="Sign out"
            aria-label="Log out of Student Portal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-red-50 hover:text-[var(--color-semantic-danger)] cursor-pointer"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside
      aria-label="Sidebar"
      className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--color-border-subtle)]"
    >
      <SidebarContent {...props} />
    </aside>
  );
}
