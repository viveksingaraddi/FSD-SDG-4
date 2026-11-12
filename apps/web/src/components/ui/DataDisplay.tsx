import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | undefined;
  children: ReactNode;
}

const CARD_PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] shadow-xs ${CARD_PADDING[padding]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | undefined;
  children: ReactNode;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] border-[var(--color-border-default)]',
  brand: 'bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)] border-blue-200',
  success:
    'bg-[var(--color-semantic-success-bg)] text-[var(--color-semantic-success-fg)] border-emerald-200',
  warning:
    'bg-[var(--color-semantic-warning-bg)] text-[var(--color-semantic-warning-fg)] border-amber-200',
  danger:
    'bg-[var(--color-semantic-danger-bg)] text-[var(--color-semantic-danger-fg)] border-red-200',
  info: 'bg-[var(--color-semantic-info-bg)] text-[var(--color-semantic-info-fg)] border-sky-200',
};

export function Badge({ variant = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}

export interface AvatarProps {
  name: string;
  src?: string | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  className?: string | undefined;
}

const AVATAR_SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-[var(--color-border-default)] ${AVATAR_SIZES[size]} ${className}`.trim()}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary-subtle)] font-semibold text-[var(--color-brand-primary)] ${AVATAR_SIZES[size]} ${className}`.trim()}
    >
      {getInitials(name)}
    </span>
  );
}

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number | undefined;
  disabled?: boolean | undefined;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string | undefined;
  className?: string | undefined;
}

export function Tabs({
  items,
  activeTab,
  onChange,
  ariaLabel = 'Sections',
  className = '',
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex flex-wrap gap-1 border-b border-[var(--color-border-default)] ${className}`.trim()}
    >
      {items.map((item) => {
        const selected = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={[
              'inline-flex min-h-[44px] items-center gap-2 border-b-2 px-3.5 text-sm font-medium transition-colors',
              selected
                ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              item.disabled ? 'cursor-not-allowed opacity-50' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <Badge variant={selected ? 'brand' : 'neutral'}>{item.badge}</Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface BreadcrumbItem {
  label: string;
  to?: string | undefined;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string | undefined;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-[var(--color-text-primary)] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'font-medium text-[var(--color-text-primary)]' : ''}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number | undefined;
  className?: string | undefined;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  className = '',
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-between gap-3 pt-3 ${className}`.trim()}
    >
      <p className="text-xs text-[var(--color-text-muted)]">
        Page <span className="font-medium text-[var(--color-text-primary)]">{page}</span> of{' '}
        <span className="font-medium text-[var(--color-text-primary)]">{safeTotalPages}</span>
        {totalItems !== undefined ? ` (${totalItems} total)` : ''}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-[44px] md:min-h-[36px] items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-[44px] md:min-h-[36px] items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
