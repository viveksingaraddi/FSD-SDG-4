/**
 * Programmatic Design Token Mirror — aligned with Phase 3 (01-design-tokens.md)
 * and apps/web/src/styles/globals.css.
 */
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: '#1d4ed8',
      primaryHover: '#1e40af',
      primaryLight: '#dbeafe',
      primaryDark: '#1e3a8a',
    },
    surface: {
      canvas: '#f8fafc',
      card: '#ffffff',
      raised: '#f1f5f9',
      sunken: '#e2e8f0',
    },
    border: {
      default: '#cbd5e1',
      strong: '#94a3b8',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      muted: '#475569',
      inverse: '#ffffff',
    },
    semantic: {
      success: '#15803d',
      successBg: '#dcfce7',
      warning: '#b45309',
      warningBg: '#fef3c7',
      danger: '#b91c1c',
      dangerBg: '#fee2e2',
      info: '#1d4ed8',
      infoBg: '#dbeafe',
      neutral: '#475569',
      neutralBg: '#f1f5f9',
    },
    focusRing: '#2563eb',
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  layout: {
    sidebarWidth: '240px',
    sidebarCompact: '64px',
    bottomNavHeight: '56px',
    headerHeight: '64px',
    contentMaxWidth: '1440px',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  zIndex: {
    sticky: 20,
    header: 30,
    sidebar: 40,
    toast: 60,
  },
} as const;
