import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-default)]',
  brand: 'bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)] border-blue-200',
  success:
    'bg-[var(--color-semantic-success-bg)] text-[var(--color-semantic-success-fg)] border-emerald-200',
  warning:
    'bg-[var(--color-semantic-warning-bg)] text-[var(--color-semantic-warning-fg)] border-amber-200',
  danger:
    'bg-[var(--color-semantic-danger-bg)] text-[var(--color-semantic-danger-fg)] border-red-200',
  info: 'bg-[var(--color-semantic-info-bg)] text-[var(--color-semantic-info-fg)] border-blue-200',
};

export function Badge({ variant = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium leading-tight ${BADGE_CLASSES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
