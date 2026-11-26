import type { HTMLAttributes, ReactNode } from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel | undefined;
  size?: HeadingSize | undefined;
  children: ReactNode;
}

const HEADING_SIZE_CLASSES: Record<HeadingSize, string> = {
  display:
    'text-[1.875rem] leading-[1.2] font-bold tracking-[-0.025em] text-[var(--color-text-primary)]',
  h1: 'text-[1.5rem] leading-[1.25] font-bold tracking-[-0.02em] text-[var(--color-text-primary)]',
  h2: 'text-[1.25rem] leading-[1.3] font-semibold tracking-[-0.015em] text-[var(--color-text-primary)]',
  h3: 'text-[1.125rem] leading-[1.35] font-semibold text-[var(--color-text-primary)]',
  h4: 'text-[1rem] leading-[1.4] font-semibold text-[var(--color-text-primary)]',
};

const LEVEL_TO_DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h4',
  6: 'h4',
};

export function Heading({ level = 2, size, className = '', children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  const resolvedSize = size ?? LEVEL_TO_DEFAULT_SIZE[level];
  return (
    <Tag className={`${HEADING_SIZE_CLASSES[resolvedSize]} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

type TextVariant = 'body' | 'small' | 'caption' | 'muted' | 'label';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div' | 'label' | undefined;
  variant?: TextVariant | undefined;
  children: ReactNode;
}

const TEXT_VARIANT_CLASSES: Record<TextVariant, string> = {
  body: 'text-[0.9375rem] leading-[1.6] text-[var(--color-text-primary)]',
  small: 'text-[0.875rem] leading-[1.5] text-[var(--color-text-secondary)]',
  caption: 'text-[0.75rem] leading-[1.4] text-[var(--color-text-muted)]',
  muted: 'text-[0.875rem] leading-[1.5] text-[var(--color-text-muted)]',
  label: 'text-[0.875rem] leading-[1.4] font-medium text-[var(--color-text-primary)]',
};

export function Text({ as = 'p', variant = 'body', className = '', children, ...rest }: TextProps) {
  const Component = as;
  return (
    <Component className={`${TEXT_VARIANT_CLASSES[variant]} ${className}`.trim()} {...rest}>
      {children}
    </Component>
  );
}
