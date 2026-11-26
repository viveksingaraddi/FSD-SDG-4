import type { ReactNode } from 'react';
import { BookOpenIcon } from '../icons/Icons.js';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-6 py-10 text-center ${className}`.trim()}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]">
        {icon ?? <BookOpenIcon className="h-5 w-5" />}
      </div>
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
