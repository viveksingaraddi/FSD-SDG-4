import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, ShieldCheck, User as UserIcon } from 'lucide-react';
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Drawer,
  DropdownMenu,
  IconButton,
  type BreadcrumbItem,
} from '@/components/ui';
import { ROLE_LABELS, ROLE_NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export interface AppShellProps {
  title?: string | undefined;
  breadcrumbs?: BreadcrumbItem[] | undefined;
  children: ReactNode;
}

export function AppShell({ title, breadcrumbs, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = user ? ROLE_NAV_ITEMS[user.role] : [];
  const roleLabel = user ? ROLE_LABELS[user.role] : 'Guest';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const renderNavLinks = (collapsed = false, onNavigate?: () => void) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <NavLink
              to={item.to}
              end={item.end ?? false}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  'flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2' : '',
                  isActive
                    ? 'bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-dvh bg-[var(--color-surface-canvas)] text-[var(--color-text-primary)]">
      {/* Desktop Sidebar (>=1024px): 240px fixed */}
      <aside
        aria-label="Primary navigation"
        className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--color-border-default)] lg:bg-[var(--color-surface-elevated)]"
      >
        <div className="flex h-[64px] items-center gap-2.5 border-b border-[var(--color-border-default)] px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">FSD-SDG-4</p>
            <p className="truncate text-[11px] text-[var(--color-text-muted)]">{roleLabel}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">{renderNavLinks(false)}</nav>
      </aside>

      {/* Tablet Icon Rail (768px - 1023px): 64px fixed */}
      <aside
        aria-label="Compact navigation"
        className="hidden md:flex md:w-[64px] md:shrink-0 md:flex-col md:border-r md:border-[var(--color-border-default)] md:bg-[var(--color-surface-elevated)] lg:hidden"
      >
        <div className="flex h-[64px] items-center justify-center border-b border-[var(--color-border-default)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">{renderNavLinks(true)}</nav>
      </aside>

      {/* Mobile Navigation Drawer (<768px) */}
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation"
        side="left"
      >
        <div className="mb-4 flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
          <Badge variant="brand">{roleLabel}</Badge>
        </div>
        <nav aria-label="Mobile drawer navigation">
          {renderNavLinks(false, () => setMobileNavOpen(false))}
        </nav>
      </Drawer>

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col pb-[56px] md:pb-0">
        {/* Top Header: 64px height */}
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-[64px] items-center justify-between gap-4 border-b border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <IconButton
              icon={<Menu className="h-5 w-5" />}
              label="Open navigation menu"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
            />
            <div className="min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
              {title && (
                <h1 className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              icon={<Bell className="h-5 w-5" />}
              label="Notifications"
              variant="ghost"
              onClick={() => {
                /* Notification center placeholder for future portal phases */
              }}
            />

            {user && (
              <DropdownMenu
                triggerLabel="Open account menu"
                trigger={
                  <span className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 hover:bg-[var(--color-surface-sunken)]">
                    <Avatar name={user.email} size="sm" />
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-[160px] truncate text-xs font-medium text-[var(--color-text-primary)]">
                        {user.email}
                      </span>
                      <span className="block text-[11px] text-[var(--color-text-muted)]">
                        {roleLabel}
                      </span>
                    </span>
                  </span>
                }
                items={[
                  {
                    id: 'role-info',
                    label: `Role: ${roleLabel}`,
                    icon: <UserIcon className="h-4 w-4" />,
                    disabled: true,
                    onSelect: () => {},
                  },
                  {
                    id: 'sign-out',
                    label: 'Sign out',
                    icon: <LogOut className="h-4 w-4" />,
                    danger: true,
                    onSelect: () => {
                      void handleLogout();
                    },
                  },
                ]}
              />
            )}
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<768px): 56px height */}
      {navItems.length > 0 && (
        <nav
          aria-label="Mobile bottom navigation"
          className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex h-[56px] items-center justify-around border-t border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-1 md:hidden"
        >
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  [
                    'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-2 text-[11px] font-medium',
                    isActive
                      ? 'text-[var(--color-brand-primary)]'
                      : 'text-[var(--color-text-muted)]',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="max-w-[72px] truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
