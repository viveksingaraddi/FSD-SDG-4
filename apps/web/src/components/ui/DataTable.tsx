import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { EmptyState, Skeleton } from './Feedback';

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  value: string;
  onChange: (value: string) => void;
  label?: string | undefined;
}

export function SearchInput({
  value,
  onChange,
  label = 'Search',
  placeholder = 'Search...',
  className = '',
  ...rest
}: SearchInputProps) {
  const inputId = useId();

  return (
    <div className={`relative flex items-center ${className}`.trim()}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[44px] md:min-h-[40px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] py-2 pr-9 pl-9 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
        {...rest}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | undefined;
  widthClass?: string | undefined;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  ariaLabel: string;
  loading?: boolean | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  emptyAction?: ReactNode | undefined;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  ariaLabel,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your current view.',
  emptyAction,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div
        aria-label={`Loading ${ariaLabel}`}
        className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-4"
      >
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
      className="table-wrapper responsive-table overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] shadow-xs"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.widthClass ?? ''}`.trim()}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-default)]">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="transition-colors hover:bg-[var(--color-surface-sunken)]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  data-label={col.header}
                  className={`px-4 py-3 text-[var(--color-text-primary)] ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`.trim()}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
