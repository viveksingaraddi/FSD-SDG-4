import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface FormFieldProps {
  id?: string | undefined;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  children: (controlProps: {
    id: string;
    'aria-invalid': 'true' | 'false';
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  className = '',
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <label htmlFor={fieldId} className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--color-semantic-danger-fg)]" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id: fieldId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': describedBy,
      })}

      {hint && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[var(--color-semantic-danger-fg)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL_BASE_CLASS =
  'w-full min-h-[44px] md:min-h-[40px] rounded-[var(--radius-md)] border bg-[var(--color-surface-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-sunken)] disabled:opacity-70';

function getBorderClass(hasError: boolean): string {
  return hasError
    ? 'border-[var(--color-semantic-danger)]'
    : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)]';
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError ? 'true' : 'false'}
      className={`${CONTROL_BASE_CLASS} ${getBorderClass(hasError)} ${className}`.trim()}
      {...rest}
    />
  );
});

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  hasError?: boolean | undefined;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ hasError = false, className = '', ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={hasError ? 'true' : 'false'}
          className={`${CONTROL_BASE_CLASS} pr-11 ${getBorderClass(hasError)} ${className}`.trim()}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-1.5 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[] | undefined;
  placeholder?: string | undefined;
  hasError?: boolean | undefined;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, hasError = false, className = '', children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError ? 'true' : 'false'}
      className={`${CONTROL_BASE_CLASS} ${getBorderClass(hasError)} ${className}`.trim()}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean | undefined;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { hasError = false, rows = 4, className = '', ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={hasError ? 'true' : 'false'}
      className={`${CONTROL_BASE_CLASS} min-h-[96px] py-2.5 ${getBorderClass(hasError)} ${className}`.trim()}
      {...rest}
    />
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string | undefined;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex min-h-[44px] cursor-pointer items-start gap-2.5 py-1.5 text-sm text-[var(--color-text-primary)] ${className}`.trim()}
    >
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-brand-primary)]"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {description && (
          <span className="text-xs text-[var(--color-text-muted)]">{description}</span>
        )}
      </span>
    </label>
  );
});

export interface RadioOption {
  value: string;
  label: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
}

export interface RadioGroupProps {
  name: string;
  legend: string;
  options: RadioOption[];
  value?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  error?: string | undefined;
  className?: string | undefined;
}

export function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset className={`flex flex-col gap-2 ${className}`.trim()}>
      <legend className="text-sm font-medium text-[var(--color-text-primary)]">{legend}</legend>
      <div className="flex flex-col gap-1.5 pt-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm hover:bg-[var(--color-surface-sunken)]"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              disabled={opt.disabled}
              onChange={(e) => onChange?.(e.target.value)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-brand-primary)]"
            />
            <span className="flex flex-col">
              <span className="font-medium text-[var(--color-text-primary)]">{opt.label}</span>
              {opt.description && (
                <span className="text-xs text-[var(--color-text-muted)]">{opt.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--color-semantic-danger-fg)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}
