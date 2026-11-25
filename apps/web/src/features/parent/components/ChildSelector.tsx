import { Users } from 'lucide-react';
import type { DemoChildDashboardData } from '@/data/parentDemoData';

export interface ChildSelectorProps {
  childrenList: DemoChildDashboardData[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
}

export function ChildSelector({
  childrenList,
  selectedChildId,
  onSelectChild,
}: ChildSelectorProps) {
  if (childrenList.length === 0) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Select linked child"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        <Users className="h-4 w-4" aria-hidden="true" />
        Linked Children:
      </span>
      {childrenList.map((child) => {
        const isSelected = child.profile.id === selectedChildId;
        const fullName = `${child.profile.firstName} ${child.profile.lastName}`;
        return (
          <button
            key={child.profile.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectChild(child.profile.id)}
            className={[
              'min-h-[40px] rounded-[var(--radius-md)] border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]',
              isSelected
                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]'
                : 'border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            <span>{fullName}</span>
            <span className="ml-2 text-xs opacity-80">
              ({child.profile.className} · {child.profile.sectionName})
            </span>
          </button>
        );
      })}
    </div>
  );
}
