import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircleIcon, CheckCircleIcon, XIcon } from '../icons/Icons.js';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white text-slate-900',
  info: 'border-blue-200 bg-white text-slate-900',
  warning: 'border-amber-200 bg-white text-slate-900',
  error: 'border-red-200 bg-white text-slate-900',
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-[var(--color-semantic-success)]',
  info: 'text-[var(--color-brand-primary)]',
  warning: 'text-[var(--color-semantic-warning)]',
  error: 'text-[var(--color-semantic-danger)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      const timer = setTimeout(() => {
        dismissToast(id);
      }, 4500);
      timersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    const map = timersRef.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 bottom-16 z-[var(--z-toast)] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 md:bottom-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 shadow-lg ${TOAST_STYLES[toast.type]}`}
          >
            <span className={`mt-0.5 shrink-0 ${ICON_COLOR[toast.type]}`}>
              {toast.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <AlertCircleIcon className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
