import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { STUDENT_PROFILE_DATA } from '../../features/student/data/studentMockData.js';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useStudentAnnouncements,
  useStudentAssignments,
  useStudentNotifications,
  useStudentProfile,
} from '../../features/student/hooks/useStudentPortal.js';
import { Drawer } from '../ui/Drawer.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';
import type { BreadcrumbItem } from './Breadcrumbs.js';
import { Header } from './Header.js';
import { STUDENT_NAV_ITEMS, Sidebar, SidebarContent } from './Sidebar.js';

export interface StudentLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
}

export function StudentLayout({ breadcrumbs, children }: StudentLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { showToast } = useToast();

  const { data: profileData } = useStudentProfile();
  const { data: notificationsData } = useStudentNotifications();
  const { data: assignmentsData } = useStudentAssignments();
  const { data: announcementsData } = useStudentAnnouncements();

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const profile = profileData ?? STUDENT_PROFILE_DATA;
  const notifications = notificationsData ?? [];
  const pendingAssignments = (assignmentsData ?? []).filter(
    (a) => a.status === 'NOT_STARTED' || a.status === 'IN_PROGRESS',
  ).length;
  const unreadAnnouncements = (announcementsData ?? []).filter((a) => !a.isRead).length;

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    showToast({
      type: 'info',
      title: 'Session preview ended',
      description:
        'Authentication is handled in a later phase. Continuing in Student Portal preview mode.',
    });
  };

  return (
    <div className="flex min-h-dvh bg-[var(--color-surface-canvas)] text-[var(--color-text-primary)]">
      {/* Desktop persistent sidebar */}
      <Sidebar
        profile={profile}
        pendingAssignments={pendingAssignments}
        unreadAnnouncements={unreadAnnouncements}
        onLogoutClick={() => setLogoutModalOpen(true)}
      />

      {/* Mobile collapsible navigation drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Student Navigation"
        side="left"
      >
        <div className="-m-4 h-[calc(100%+2rem)]">
          <SidebarContent
            profile={profile}
            pendingAssignments={pendingAssignments}
            unreadAnnouncements={unreadAnnouncements}
            onNavigate={() => setMobileMenuOpen(false)}
            onLogoutClick={() => {
              setMobileMenuOpen(false);
              setLogoutModalOpen(true);
            }}
          />
        </div>
      </Drawer>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <Header
          profile={profile}
          breadcrumbs={breadcrumbs}
          notifications={notifications}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onMarkNotificationRead={(id) => markReadMutation.mutate(id)}
          onMarkAllNotificationsRead={() => markAllReadMutation.mutate()}
          onLogoutClick={() => setLogoutModalOpen(true)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile quick bottom navigation */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex h-14 items-center justify-around border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-1 lg:hidden"
      >
        {STUDENT_NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                `flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-2 text-[11px] font-medium ${
                  isActive ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-muted)]'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-[72px] truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* UI-only Logout confirmation modal */}
      <Modal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign out of Student Portal?"
        description="You are currently viewing the Student Portal UI. Sign-out clears your active workspace preview."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-3 text-xs text-[var(--color-text-secondary)]">
            Signed in as <span className="font-semibold">{profile.fullName}</span> ({profile.email})
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
              Stay signed in
            </Button>
            <Button variant="danger" onClick={handleConfirmLogout}>
              Confirm sign out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
