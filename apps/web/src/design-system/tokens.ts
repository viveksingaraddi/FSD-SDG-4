/**
 * Programmatic Design Token Mirror — EDVARQ Enterprise Design System
 * Aligned with apps/web/src/styles/globals.css.
 * Brand direction: Deep midnight navy, refined slate, electric blue accent.
 */
export const DESIGN_TOKENS = {
  brand: {
    name: 'EDVARQ',
    tagline: 'One institution. One connected intelligence platform.',
    category: 'Enterprise Education Management & Institutional Intelligence SaaS',
    pendingNotice: 'The Edvarq name is a working brand pending trademark and domain clearance.',
  },
  colors: {
    brand: {
      primary: '#0f172a', // Deep Midnight Navy
      primaryHover: '#1e293b',
      primaryLight: '#f1f5f9',
      primaryDark: '#020617',
      accent: '#2563eb', // Electric Blue
      accentHover: '#1d4ed8',
      accentLight: '#dbeafe',
      accentSubtle: '#eff6ff',
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
      muted: '#64748b',
      inverse: '#ffffff',
    },
    semantic: {
      success: '#059669', // Restrained Emerald
      successBg: '#ecfdf5',
      warning: '#d97706', // Amber
      warningBg: '#fffbeb',
      danger: '#dc2626', // Accessible Red
      dangerBg: '#fef2f2',
      info: '#2563eb', // Electric Blue
      infoBg: '#eff6ff',
      neutral: '#475569',
      neutralBg: '#f1f5f9',
    },
    focusRing: '#2563eb',
  },
  typography: {
    fontSans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
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
