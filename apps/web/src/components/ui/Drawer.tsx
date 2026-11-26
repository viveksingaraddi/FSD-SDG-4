import { useEffect, useRef, type ReactNode } from 'react';
import { XIcon } from '../icons/Icons.js';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: ReactNode;
}

export function Drawer({ open, onClose, title, side = 'left', children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-drawer)] flex bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`flex h-full w-full max-w-xs flex-col bg-[var(--color-surface-card)] shadow-2xl outline-none ${side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r'
          } border-[var(--color-border-subtle)]`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border-subtle)] px-4">
          <span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
