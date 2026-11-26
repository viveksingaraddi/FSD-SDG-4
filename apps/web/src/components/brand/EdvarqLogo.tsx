import type { HTMLAttributes } from 'react';

export interface EdvarqLogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'mark' | 'wordmark' | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  theme?: 'light' | 'dark' | undefined;
  showTagline?: boolean | undefined;
  subtitle?: string | undefined;
}

const SIZE_MAP = {
  sm: { icon: 24, wordmark: 'text-sm', badge: 'h-6 w-6' },
  md: { icon: 32, wordmark: 'text-base', badge: 'h-8 w-8' },
  lg: { icon: 40, wordmark: 'text-lg', badge: 'h-10 w-10' },
  xl: { icon: 48, wordmark: 'text-xl', badge: 'h-12 w-12' },
};

/**
 * Precision Edvarq Brand Icon SVG.
 * Combines an institutional foundation chevron with an interconnected intelligence facet.
 */
export function EdvarqMark({
  size = 32,
  theme = 'light',
  className = '',
}: {
  size?: number | undefined;
  theme?: 'light' | 'dark' | undefined;
  className?: string | undefined;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Precision rounded squircle container */}
      <rect width="40" height="40" rx="10" fill={theme === 'dark' ? '#0F172A' : '#0B192C'} />
      {/* Subtle institutional border */}
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="9.25"
        stroke={theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(37,99,235,0.25)'}
        strokeWidth="1.5"
      />
      {/* Lower foundation bar */}
      <path
        d="M10 28.5H27C28.3807 28.5 29.5 27.3807 29.5 26V25H12C10.8954 25 10 25.8954 10 27V28.5Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Central neural beam (Electric Blue) */}
      <path
        d="M10 20.5H24.5C25.3284 20.5 26 19.8284 26 19C26 18.1716 25.3284 17.5 24.5 17.5H10V20.5Z"
        fill="#2563EB"
      />
      {/* Upper architectural lintel */}
      <path
        d="M10 11.5H28C29.1046 11.5 30 12.3954 30 13.5V14H10V11.5Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Ascending intelligence node (Cyan / Electric Blue apex) */}
      <circle cx="28.5" cy="19" r="2.5" fill="#38BDF8" />
    </svg>
  );
}

/**
 * Official EDVARQ Brand Component.
 * Supports compact mark, horizontal wordmark, and enterprise full layout with tagline.
 */
export function EdvarqLogo({
  variant = 'full',
  size = 'md',
  theme = 'light',
  showTagline = false,
  subtitle,
  className = '',
  ...rest
}: EdvarqLogoProps) {
  const { icon, wordmark } = SIZE_MAP[size];

  const textColor = theme === 'dark' ? 'text-white' : 'text-[var(--color-text-primary)]';
  const subtitleColor = theme === 'dark' ? 'text-slate-400' : 'text-[var(--color-text-muted)]';

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`.trim()} {...rest}>
        <EdvarqMark size={icon} theme={theme} />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col ${className}`.trim()} {...rest}>
        <span
          className={`font-black tracking-[0.08em] uppercase ${textColor} ${wordmark}`}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          EDVARQ
        </span>
        {subtitle && (
          <span className={`text-[11px] leading-tight ${subtitleColor}`}>{subtitle}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
      aria-label="EDVARQ — Connected Intelligence Platform"
      {...rest}
    >
      <EdvarqMark size={icon} theme={theme} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-[0.08em] uppercase ${textColor} ${wordmark}`}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            EDVARQ
          </span>
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-accent)]"
            aria-hidden="true"
          />
        </div>
        {subtitle && (
          <p className={`truncate text-[11px] font-medium leading-tight ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
        {showTagline && !subtitle && (
          <p className={`truncate text-[10px] tracking-tight ${subtitleColor}`}>
            One institution. One connected intelligence platform.
          </p>
        )}
      </div>
    </div>
  );
}

export default EdvarqLogo;
