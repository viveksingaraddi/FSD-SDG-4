import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  loading?: boolean | undefined;
  leftIcon?: ReactNode | undefined;
  rightIcon?: ReactNode | undefined;
  fullWidth?: boolean | undefined;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-hover)] active:bg-[var(--color-brand-primary-active)] border border-transparent shadow-xs',
  secondary:
    'bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] border border-[var(--color-border-default)]',
  outline:
    'bg-[var(--color-surface-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border-strong)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)] border border-transparent',
  danger:
    'bg-[var(--color-semantic-danger)] text-[var(--color-text-inverse)] hover:bg-[#991b1b] active:bg-[#7f1d1d] border border-transparent shadow-xs font-semibold',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] md:min-h-[34px] px-3 text-xs gap-1.5',
  md: 'min-h-[44px] md:min-h-[40px] px-4 text-sm gap-2',
  lg: 'min-h-[48px] px-5 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={[
        'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors duration-[var(--transition-fast)] whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  label: string;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  loading?: boolean | undefined;
}

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] min-w-[44px] md:min-h-[34px] md:min-w-[34px] p-1.5',
  md: 'min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] p-2',
  lg: 'min-h-[48px] min-w-[48px] p-2.5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    label,
    variant = 'ghost',
    size = 'md',
    loading = false,
    disabled,
    type = 'button',
    className = '',
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={[
        'inline-flex items-center justify-center rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        ICON_SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
    </button>
  );
});
