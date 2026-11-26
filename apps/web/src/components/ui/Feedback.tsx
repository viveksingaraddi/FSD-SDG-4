import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Inbox, Info, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant | undefined;
  title?: string | undefined;
  children: ReactNode;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
}

const ALERT_STYLES: Record<AlertVariant, string> = {
  info: 'border-sky-200 bg-[var(--color-semantic-info-bg)] text-[var(--color-semantic-info-fg)]',
  success:
    'border-emerald-200 bg-[var(--color-semantic-success-bg)] text-[var(--color-semantic-success-fg)]',
  warning:
    'border-amber-200 bg-[var(--color-semantic-warning-bg)] text-[var(--color-semantic-warning-fg)]',
  danger:
    'border-red-200 bg-[var(--color-semantic-danger-bg)] text-[var(--color-semantic-danger-fg)]',
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />;
    case 'danger':
      return <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />;
    default:
      return <Info className="h-5 w-5 shrink-0" aria-hidden="true" />;
  }
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  return (
    <div
      role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${ALERT_STYLES[variant]} ${className}`.trim()}
    >
      <div className="mt-0.5">
        <AlertIcon variant={variant} />
      </div>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss message"
          onClick={onDismiss}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] opacity-80 hover:opacity-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export interface SkeletonProps {
  className?: string | undefined;
  label?: string | undefined;
}

export function Skeleton({ className = 'h-4 w-full', label }: SkeletonProps) {
  return (
    <div
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-border-default)] ${className}`.trim()}
    />
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-6 py-12 text-center ${className}`.trim()}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string | undefined;
  description: string;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

export function ErrorState({
  title = 'Unable to load content',
  description,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-red-200 bg-[var(--color-semantic-danger-bg)] px-6 py-10 text-center ${className}`.trim()}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-semantic-danger-fg)] shadow-xs">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={onRetry}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string | undefined;
  variant: AlertVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    toastSequence += 1;
    const id = `toast-${toastSequence}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[var(--z-toast)] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto shadow-lg">
            <Alert
              variant={toast.variant}
              title={toast.title}
              onDismiss={() => dismissToast(toast.id)}
            >
              {toast.description ?? ''}
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
