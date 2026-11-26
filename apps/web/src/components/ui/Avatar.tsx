export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  return (
    <span
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)] font-semibold text-[var(--color-brand-primary-dark)] ${SIZE_MAP[size]} ${className}`.trim()}
    >
      {getInitials(name)}
    </span>
  );
}
