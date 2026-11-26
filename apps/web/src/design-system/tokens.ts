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
      primarySubtle: '#eff6ff',
    },
    surface: {
      canvas: '#f8fafc',
      card: '#ffffff',
      raised: '#f1f5f9',
      sunken: '#e2e8f0',
    },
    border: {
      default: '#cbd5e1',
      subtle: '#e2e8f0',
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
  layout: {
    sidebarWidth: '256px',
    bottomNavHeight: '56px',
    headerHeight: '64px',
    contentMaxWidth: '1440px',
  },
} as const;
