import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
}

const MODAL_SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className={`m-auto w-[calc(100%-2rem)] ${MODAL_SIZE_CLASSES[size]} rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-white p-0 text-[var(--color-text-primary)] shadow-2xl`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-default)] bg-white px-6 py-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="bg-white px-6 py-4">{children}</div>

      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border-default)] bg-slate-50 bg-[var(--color-surface-sunken)] px-6 py-3.5">
          {footer}
        </div>
      )}
    </dialog>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  variant?: 'danger' | 'primary' | undefined;
  loading?: boolean | undefined;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            autoFocus={variant === 'danger'}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
    </Modal>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right' | undefined;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, side = 'right', children }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  const alignmentClass = side === 'left' ? 'mr-auto ml-0' : 'ml-auto mr-0';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className={`${alignmentClass} my-0 h-dvh max-h-dvh w-full max-w-sm border-[var(--color-border-default)] bg-white p-0 text-[var(--color-text-primary)] shadow-2xl ${
        side === 'left' ? 'border-r' : 'border-l'
      }`}
    >
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] bg-white px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-white p-5">{children}</div>
      </div>
    </dialog>
  );
}

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode | undefined;
  danger?: boolean | undefined;
  disabled?: boolean | undefined;
  onSelect: () => void;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  triggerLabel: string;
  items: DropdownMenuItem[];
  align?: 'left' | 'right' | undefined;
  className?: string | undefined;
}

export function DropdownMenu({
  trigger,
  triggerLabel,
  items,
  align = 'right',
  className = '',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`.trim()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={triggerLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center rounded-[var(--radius-md)]"
      >
        {trigger}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={`absolute z-[var(--z-dropdown)] mt-1.5 min-w-[14rem] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-white py-1.5 shadow-2xl ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={[
                'flex w-full min-h-[40px] items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors',
                item.danger
                  ? 'text-[var(--color-semantic-danger)] hover:bg-[var(--color-semantic-danger-bg)] font-medium'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)]',
                item.disabled ? 'cursor-not-allowed opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.icon && (
                <span className="shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[var(--z-tooltip)] mb-2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--color-text-primary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-inverse)] shadow-md"
        >
          {content}
        </span>
      )}
    </span>
  );
}
