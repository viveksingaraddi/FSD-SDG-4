export interface ProgressChartPoint {
  label: string;
  value: number;
  secondaryLabel?: string;
}

export interface ProgressChartProps {
  title: string;
  subtitle?: string;
  data: ProgressChartPoint[];
  maxValue?: number;
  unit?: string;
  barTone?: 'brand' | 'success' | 'indigo';
}

const BAR_CLASS: Record<NonNullable<ProgressChartProps['barTone']>, string> = {
  brand: 'bg-[var(--color-brand-primary)]',
  success: 'bg-[var(--color-semantic-success)]',
  indigo: 'bg-indigo-600',
};

export function ProgressChart({
  title,
  subtitle,
  data,
  maxValue,
  unit = '',
  barTone = 'brand',
}: ProgressChartProps) {
  const computedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <section aria-label={title} className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
      </div>

      <div
        className="grid items-end gap-3 pt-2"
        style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))` }}
      >
        {data.map((point) => {
          const pct = Math.max(8, Math.min(100, Math.round((point.value / computedMax) * 100)));
          return (
            <div key={point.label} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                {point.value}
                {unit}
              </span>
              <div className="flex h-36 w-full max-w-[44px] items-end rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] p-1">
                <div
                  className={`w-full rounded-[var(--radius-sm)] transition-all ${BAR_CLASS[barTone]}`}
                  style={{ height: `${pct}%` }}
                  role="img"
                  aria-label={`${point.label}: ${point.value}${unit}${
                    point.secondaryLabel ? ` (${point.secondaryLabel})` : ''
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {point.label}
              </span>
              {point.secondaryLabel && (
                <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-full">
                  {point.secondaryLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
