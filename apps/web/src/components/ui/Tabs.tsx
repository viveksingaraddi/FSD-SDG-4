import { Badge } from './Badge.js';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  items,
  activeTab,
  onChange,
  ariaLabel = 'Tabs',
  className = '',
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex flex-wrap gap-1 border-b border-[var(--color-border-subtle)] ${className}`.trim()}
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
            className={`inline-flex min-h-[44px] items-center gap-2 border-b-2 px-3.5 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
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
