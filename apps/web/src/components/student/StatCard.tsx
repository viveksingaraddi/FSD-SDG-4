import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card.js';

export type StatTone = 'brand' | 'success' | 'warning' | 'info';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone?: StatTone;
  to?: string;
}

const TONE_ICON_BG: Record<StatTone, string> = {
  brand: 'bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]',
  success: 'bg-[var(--color-semantic-success-bg)] text-[var(--color-semantic-success)]',
  warning: 'bg-[var(--color-semantic-warning-bg)] text-[var(--color-semantic-warning)]',
  info: 'bg-[var(--color-semantic-info-bg)] text-[var(--color-semantic-info)]',
};

export function StatCard({ label, value, hint, icon, tone = 'brand', to }: StatCardProps) {
  const content = (
    <Card interactive={Boolean(to)} className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{hint}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${TONE_ICON_BG[tone]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block rounded-[var(--radius-lg)] focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
