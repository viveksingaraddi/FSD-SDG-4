export interface LoadingStateProps {
  label?: string;
  cards?: number;
  variant?: 'cards' | 'list' | 'detail';
}

export function LoadingState({
  label = 'Loading learning content...',
  cards = 4,
  variant = 'cards',
}: LoadingStateProps) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="space-y-5">
      <span className="sr-only">{label}</span>
      <div className="h-24 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5">
        <div className="h-4 w-44 rounded bg-[var(--color-surface-sunken)]" />
        <div className="mt-3 h-3 w-72 max-w-full rounded bg-[var(--color-surface-raised)]" />
      </div>

      {variant === 'cards' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5"
            >
              <div className="h-3 w-24 rounded bg-[var(--color-surface-sunken)]" />
              <div className="mt-4 h-7 w-16 rounded bg-[var(--color-surface-sunken)]" />
              <div className="mt-3 h-3 w-32 rounded bg-[var(--color-surface-raised)]" />
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-3">
          {Array.from({ length: cards }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4"
            >
              <div className="h-4 w-56 rounded bg-[var(--color-surface-sunken)]" />
              <div className="mt-2 h-3 w-40 rounded bg-[var(--color-surface-raised)]" />
            </div>
          ))}
        </div>
      )}

      {variant === 'detail' && (
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6">
          <div className="h-5 w-64 rounded bg-[var(--color-surface-sunken)]" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-[var(--color-surface-raised)]" />
            <div className="h-3 w-5/6 rounded bg-[var(--color-surface-raised)]" />
            <div className="h-3 w-2/3 rounded bg-[var(--color-surface-raised)]" />
          </div>
        </div>
      )}
    </div>
  );
}
