import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: ReactNode;
}

const PADDING_MAP = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        interactive
          ? 'transition-all hover:border-[var(--color-border-default)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]'
          : ''
      } ${PADDING_MAP[padding]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
